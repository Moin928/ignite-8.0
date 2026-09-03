import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:civic_app/core/supabase_provider.dart';
import 'package:civic_app/models/report.dart';

final myReportsProvider = StateNotifierProvider<MyReportsNotifier, AsyncValue<List<Report>>>((ref) {
  final supabase = ref.watch(supabaseProvider);
  return MyReportsNotifier(supabase);
});

class MyReportsNotifier extends StateNotifier<AsyncValue<List<Report>>> {
  final SupabaseClient _supabase;
  RealtimeChannel? _channel;

  MyReportsNotifier(this._supabase) : super(const AsyncValue.loading()) {
    fetchReports();
    _subscribeRealtime();
  }

  Future<void> fetchReports() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) {
      state = const AsyncValue.data([]);
      return;
    }

    try {
      final response = await _supabase
          .from('reports')
          .select('*, issues(*)')
          .eq('citizen_id', userId)
          .order('created_at', ascending: false);

      final reports = (response as List).map((json) => Report.fromJson(json)).toList();
      state = AsyncValue.data(reports);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  void _subscribeRealtime() {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return;

    _channel = _supabase
        .channel('profile_realtime_$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'issues',
          callback: (payload) {
            fetchReports();
          },
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'reports',
          callback: (payload) {
            fetchReports();
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

// Set of issue IDs reported by the logged in user
final userReportedIssueIdsProvider = Provider<Set<String>>((ref) {
  final reportsAsync = ref.watch(myReportsProvider);
  return reportsAsync.maybeWhen(
    data: (reports) => reports.map((r) => r.issueId ?? '').where((id) => id.isNotEmpty).toSet(),
    orElse: () => <String>{},
  );
});
