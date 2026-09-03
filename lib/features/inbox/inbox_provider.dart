import 'dart:io';
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
    data: (items) => items.where((n) => !n.isRead || (n.actionRequired && !n.actionCompleted)).length,
    orElse: () => 0,
  );
});

class NotificationsNotifier extends StateNotifier<AsyncValue<List<NotificationItem>>> {
  final SupabaseClient _supabase;
  RealtimeChannel? _channel;

  NotificationsNotifier(this._supabase) : super(const AsyncValue.loading()) {
    fetchNotifications();
    _subscribeRealtime();
  }

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
      state = AsyncValue.data([]); // Fallback to empty if table is not yet created
    }
  }

  void _subscribeRealtime() {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return;

    _channel = _supabase
        .channel('citizen_notifications_$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'notifications',
          callback: (payload) => fetchNotifications(),
        )
        .subscribe();
  }

  Future<void> markAsRead(String notificationId) async {
    try {
      await _supabase.from('notifications').update({'is_read': true}).eq('id', notificationId);
      await fetchNotifications();
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

    // 2. Update notification item as completed
    await _supabase.from('notifications').update({
      'action_completed': true,
      'is_read': true,
      'evidence_image_url': evidenceUrl,
    }).eq('id', notificationId);

    // 3. If issueId is present, attach report entry or update issue description
    if (issueId != null && issueId.isNotEmpty) {
      try {
        await _supabase.from('reports').insert({
          'issue_id': issueId,
          'citizen_id': user.id,
          'image_url': evidenceUrl,
          'description': note != null && note.isNotEmpty
              ? 'Additional Evidence: $note'
              : 'Additional evidence photo submitted by citizen upon municipal request.',
          'location': 'POINT(0 0)', // placeholder if no new gps
          'is_spam': false,
        });
      } catch (e) {
        debugPrint("Notice inserting evidence report row: $e");
      }
    }

    await fetchNotifications();
  }

  @override
  void dispose() {
    _channel?.unsubscribe();
    super.dispose();
  }
}
