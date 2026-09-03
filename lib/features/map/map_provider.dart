import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:civic_app/core/supabase_provider.dart';
import 'package:civic_app/models/issue.dart';

final issuesProvider = StateNotifierProvider<IssuesNotifier, AsyncValue<List<Issue>>>((ref) {
  final supabase = ref.watch(supabaseProvider);
  return IssuesNotifier(supabase);
});

class IssuesNotifier extends StateNotifier<AsyncValue<List<Issue>>> {
  final SupabaseClient _supabase;
  RealtimeChannel? _channel;

  IssuesNotifier(this._supabase) : super(const AsyncValue.loading()) {
    fetchIssues();
    _subscribeRealtime();
  }

  Future<void> fetchIssues() async {
    try {
      final response = await _supabase
          .from('issues')
          .select('*, reports(image_url), repairs(*)')
          .order('created_at', ascending: false);

      final issues = (response as List).map((json) => Issue.fromJson(json)).toList();
      state = AsyncValue.data(issues);
    } catch (_) {
      try {
        final fallbackRes = await _supabase
            .from('issues')
            .select('*, reports(image_url)')
            .order('created_at', ascending: false);
        final issues = (fallbackRes as List).map((json) => Issue.fromJson(json)).toList();
        state = AsyncValue.data(issues);
      } catch (e2, st2) {
        state = AsyncValue.error(e2, st2);
      }
    }
  }

  void _subscribeRealtime() {
    _channel = _supabase
        .channel('public:issues_realtime')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'issues',
          callback: (payload) {
            fetchIssues();
          },
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'reports',
          callback: (payload) {
            fetchIssues();
          },
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'repairs',
          callback: (payload) {
            fetchIssues();
          },
        )
        .subscribe();
  }

  @override
  void dispose() {
    _channel?.unsubscribe();
    super.dispose();
  }
}
