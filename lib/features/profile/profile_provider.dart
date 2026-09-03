import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:civic_app/core/supabase_provider.dart';
import 'package:civic_app/models/report.dart';
import 'package:civic_app/models/repair.dart';

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
      // 1. Fetch reports with linked issues
      final response = await _supabase
          .from('reports')
          .select('*, issues(*)')
          .eq('citizen_id', userId)
          .order('created_at', ascending: false);

      final reports = (response as List).map((json) => Report.fromJson(json)).toList();

      // 2. Fetch repairs for all issue IDs to ensure proof photos are guaranteed to be loaded
      final issueIds = reports
          .map((r) => r.issue?.id ?? r.issueId)
          .where((id) => id != null && id.isNotEmpty)
          .cast<String>()
          .toList();

      if (issueIds.isNotEmpty) {
        try {
          final repairsResponse = await _supabase
              .from('repairs')
              .select('*')
              .inFilter('issue_id', issueIds)
              .order('created_at', ascending: false);

          final repairMap = <String, Repair>{};
          for (final repairJson in repairsResponse as List) {
            final rep = Repair.fromJson(repairJson);
            // Keep latest repair per issue
            if (!repairMap.containsKey(rep.issueId)) {
              repairMap[rep.issueId] = rep;
            }
          }

          debugPrint("Found ${repairMap.length} repairs for citizen reports.");

          // Merge repairs into report.issue
          final enrichedReports = reports.map((r) {
            final id = r.issue?.id ?? r.issueId;
            if (r.issue != null && id != null && repairMap.containsKey(id)) {
              final enrichedIssue = r.issue!.copyWith(repair: repairMap[id]);
              return r.copyWith(issue: enrichedIssue);
            }
            return r;
          }).toList();

          state = AsyncValue.data(enrichedReports);
          return;
        } catch (e) {
          debugPrint("Note fetching repairs table: $e");
        }
      }

      state = AsyncValue.data(reports);
    } catch (e, st) {
      debugPrint("Error in fetchReports: $e");
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
          callback: (payload) => fetchReports(),
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'reports',
          callback: (payload) => fetchReports(),
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'repairs',
          callback: (payload) => fetchReports(),
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
    data: (reports) => reports.map((r) => r.issue?.id ?? r.issueId ?? '').where((id) => id.isNotEmpty).toSet(),
    orElse: () => <String>{},
  );
});
