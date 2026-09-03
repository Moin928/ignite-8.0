import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:civic_app/core/supabase_provider.dart';
import 'package:civic_app/models/report.dart';

final myReportsProvider = FutureProvider<List<Report>>((ref) async {
  final supabase = ref.read(supabaseProvider);
  final userId = supabase.auth.currentUser?.id;

  if (userId == null) return [];

  final response = await supabase
      .from('reports')
      .select('*, issues(*)')
      .eq('citizen_id', userId)
      .order('created_at', ascending: false);

  return (response as List).map((json) => Report.fromJson(json)).toList();
});
