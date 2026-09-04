import 'dart:io';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cloudinary_public/cloudinary_public.dart';
import 'package:civic_app/core/supabase_provider.dart';
import 'package:civic_app/core/env.dart';
import 'package:civic_app/models/notification_item.dart';

final notificationsProvider = StateNotifierProvider<NotificationsNotifier, AsyncValue<List<NotificationItem>>>((ref) {
  final supabase = ref.watch(supabaseProvider);
  return NotificationsNotifier(supabase);
});

final unreadNotificationsCountProvider = Provider<int>((ref) {
  final notifsAsync = ref.watch(notificationsProvider);
  return notifsAsync.maybeWhen(
    // Count unread standard notifications AND pending evidence requests
    data: (items) => items.where((n) => !n.isRead || (n.actionRequired && !n.actionCompleted)).length,
    orElse: () => 0,
  );
});

// Expose a Stream<List> that other screens (e.g. WorkerDashboard) can listen to
// for high-priority nudges via Supabase's .stream() API (as per web portal spec)
Stream<List<Map<String, dynamic>>> citizenNotificationsStream(SupabaseClient supabase) {
  final userId = supabase.auth.currentUser?.id;
  if (userId == null) return const Stream.empty();
  return supabase
      .from('notifications')
      .stream(primaryKey: ['id'])
      .eq('citizen_id', userId)
      .order('created_at', ascending: false);
}

class NotificationsNotifier extends StateNotifier<AsyncValue<List<NotificationItem>>> {
  final SupabaseClient _supabase;
  StreamSubscription<List<Map<String, dynamic>>>? _streamSub;

  NotificationsNotifier(this._supabase) : super(const AsyncValue.loading()) {
    _subscribeStream();
  }

  // Use Supabase .stream() for real-time (aligned with web portal spec)
  void _subscribeStream() {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) {
      state = const AsyncValue.data([]);
      return;
    }

    try {
      _streamSub = _supabase
          .from('notifications')
          .stream(primaryKey: ['id'])
          .eq('citizen_id', userId)
          .order('created_at', ascending: false)
          .listen(
        (rows) {
          final items = rows.map((json) => NotificationItem.fromJson(json)).toList();
          state = AsyncValue.data(items);
        },
        onError: (e) {
          debugPrint("Notification stream error: $e");
          state = AsyncValue.data([]);
        },
      );
    } catch (e) {
      debugPrint("Note setting up notification stream: $e");
      state = AsyncValue.data([]);
    }
  }

  // Manual refresh (used by pull-to-refresh)
  Future<void> fetchNotifications() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) {
      state = const AsyncValue.data([]);
      return;
    }

    try {
      final response = await _supabase
          .from('notifications')
          .select('*')
          .eq('citizen_id', userId)
          .order('created_at', ascending: false);

      final items = (response as List).map((json) => NotificationItem.fromJson(json)).toList();
      state = AsyncValue.data(items);
    } catch (e) {
      debugPrint("Note fetching notifications: $e");
      state = AsyncValue.data([]);
    }
  }

  // Check if an evidence_request exists for a specific issue (per web portal Step B spec)
  Future<NotificationItem?> checkEvidenceRequest(String issueId) async {
    try {
      final response = await _supabase
          .from('notifications')
          .select()
          .eq('issue_id', issueId)
          .eq('type', 'evidence_request') // web portal uses 'evidence_request'
          .eq('is_read', false)
          .maybeSingle();
      if (response == null) return null;
      return NotificationItem.fromJson(response);
    } catch (e) {
      debugPrint("Error checking evidence request: $e");
      return null;
    }
  }

  Future<void> markAsRead(String notificationId) async {
    try {
      await _supabase.from('notifications').update({'is_read': true}).eq('id', notificationId);
    } catch (e) {
      debugPrint("Error marking as read: $e");
    }
  }

  Future<void> uploadAdditionalEvidence({
    required String notificationId,
    required String? issueId,
    required File imageFile,
    String? note,
  }) async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw Exception("User not logged in");

    // 1. Upload new evidence photo to Cloudinary
    final cloudinary = CloudinaryPublic(
      Env.cloudinaryCloudName,
      Env.cloudinaryUploadPreset,
      cache: false,
    );

    final uploadRes = await cloudinary.uploadFile(
      CloudinaryFile.fromFile(
        imageFile.path,
        folder: 'civic_evidence',
        resourceType: CloudinaryResourceType.Image,
      ),
    );

    final evidenceUrl = uploadRes.secureUrl;
    debugPrint("Uploaded evidence to Cloudinary: $evidenceUrl");

    // 2. Insert a new row into reports (per web portal Step C spec)
    if (issueId != null && issueId.isNotEmpty) {
      try {
        await _supabase.from('reports').insert({
          'issue_id': issueId,
          'citizen_id': user.id,
          'image_url': evidenceUrl,
          'description': note != null && note.isNotEmpty
              ? 'Additional Evidence: $note'
              : 'Additional requested photo uploaded by citizen',
          'location': 'POINT(0 0)',
          'is_spam': false,
        });
      } catch (e) {
        debugPrint("Notice inserting evidence report row: $e");
      }
    }

    // 3. Mark notification as read + complete (per web portal Step C spec)
    await _supabase.from('notifications').update({
      'is_read': true,
      'action_completed': true,
      'evidence_image_url': evidenceUrl,
    }).eq('id', notificationId);
    // Stream auto-updates state — no manual fetch needed
  }

  @override
  void dispose() {
    _streamSub?.cancel();
    super.dispose();
  }
}
