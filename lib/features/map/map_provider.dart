import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:civic_app/core/supabase_provider.dart';
import 'package:civic_app/models/issue.dart';

final issuesProvider = FutureProvider<List<Issue>>((ref) async {
  final supabase = ref.read(supabaseProvider);
  final response = await supabase
      .from('issues')
      .select()
      .order('created_at', ascending: false);

  return (response as List).map((json) => Issue.fromJson(json)).toList();
});
