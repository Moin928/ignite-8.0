import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cloudinary_public/cloudinary_public.dart';
import 'package:civic_app/core/supabase_provider.dart';
import 'package:civic_app/core/env.dart';
import 'package:civic_app/models/issue.dart';

final workerIssuesProvider = StateNotifierProvider<WorkerIssuesNotifier, AsyncValue<List<Issue>>>((ref) {
  final supabase = ref.watch(supabaseProvider);
  return WorkerIssuesNotifier(supabase);
});

class WorkerIssuesNotifier extends StateNotifier<AsyncValue<List<Issue>>> {
  final SupabaseClient _supabase;
  RealtimeChannel? _channel;

  WorkerIssuesNotifier(this._supabase) : super(const AsyncValue.loading()) {
    fetchWorkerIssues();
    _subscribeRealtime();
  }

  Future<void> fetchWorkerIssues() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) {
      state = const AsyncValue.data([]);
      return;
    }

    try {
      dynamic response;
      try {
        response = await _supabase
            .from('issues')
            .select('*, reports(image_url), repairs(*)')
            .eq('assigned_worker_id', userId)
            .order('created_at', ascending: false);
      } catch (e) {
        debugPrint("Warning fetching with repairs join: $e. Falling back to issues query.");
        response = await _supabase
            .from('issues')
            .select('*, reports(image_url)')
            .eq('assigned_worker_id', userId)
            .order('created_at', ascending: false);
      }

      final issues = (response as List).map((json) => Issue.fromJson(json)).toList();
      state = AsyncValue.data(issues);
    } catch (e, st) {
      debugPrint("Error fetching worker issues: $e");
      state = AsyncValue.error(e, st);
    }
  }

  void _subscribeRealtime() {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return;

    _channel = _supabase
        .channel('worker_issues_realtime_$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'issues',
          callback: (payload) => fetchWorkerIssues(),
        )
        .subscribe();
  }

  Future<void> startWork(String issueId) async {
    try {
      await _supabase.from('issues').update({
        'status': 'in_progress',
        'updated_at': DateTime.now().toIso8601String(),
      }).eq('id', issueId);

      await fetchWorkerIssues();
    } catch (e) {
      debugPrint("Error starting work: $e");
      rethrow;
    }
  }

  Future<void> completeRepair({
    required String issueId,
    required File afterImageFile,
    required String notes,
  }) async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw Exception("Worker not logged in");

    debugPrint("Starting completeRepair for issue: $issueId");

    // 0. Ensure worker profile exists so foreign key constraints pass
    try {
      final metaName = (user.userMetadata?['full_name'] as String?) ?? 'Municipal Worker';
      await _supabase.from('profiles').upsert({
        'id': user.id,
        'full_name': metaName,
        'role': 'worker',
      });
    } catch (e) {
      debugPrint("Profile upsert notice: $e");
    }

    // 1. Upload After-Photo to Cloudinary
    debugPrint("Uploading after photo to Cloudinary...");
    final cloudinary = CloudinaryPublic(
      Env.cloudinaryCloudName,
      Env.cloudinaryUploadPreset,
      cache: false,
    );

    final uploadRes = await cloudinary.uploadFile(
      CloudinaryFile.fromFile(
        afterImageFile.path,
        folder: 'civic_repairs',
        resourceType: CloudinaryResourceType.Image,
      ),
    );

    final afterImageUrl = uploadRes.secureUrl;
    debugPrint("Cloudinary upload successful: $afterImageUrl");

    // 2. Insert repair proof into repairs table (with resilient fallback for columns)
    debugPrint("Inserting into repairs table...");
    try {
      await _supabase.from('repairs').insert({
        'issue_id': issueId,
        'worker_id': user.id,
        'after_image_url': afterImageUrl,
        'notes': notes.trim(),
        'ai_verification_status': 'pending',
        'repaired_at': DateTime.now().toIso8601String(),
      });
      debugPrint("Successfully inserted with all columns into repairs table.");
    } catch (e) {
      debugPrint("Retrying repairs insert without optional columns: $e");
      await _supabase.from('repairs').insert({
        'issue_id': issueId,
        'worker_id': user.id,
        'after_image_url': afterImageUrl,
        'notes': notes.trim(),
      });
      debugPrint("Successfully inserted with minimal columns into repairs table.");
    }

    // 3. Update issue status to 'repaired'
    debugPrint("Updating issue status to repaired...");
    await _supabase.from('issues').update({
      'status': 'repaired',
      'updated_at': DateTime.now().toIso8601String(),
    }).eq('id', issueId);
    debugPrint("Issue status updated to 'repaired'.");

    await fetchWorkerIssues();
  }

  @override
  void dispose() {
    _channel?.unsubscribe();
    super.dispose();
  }
}
