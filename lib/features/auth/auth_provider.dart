import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:civic_app/core/supabase_provider.dart';
import 'package:civic_app/models/profile.dart';

final authProvider = StateNotifierProvider<AuthNotifier, AsyncValue<User?>>((ref) {
  return AuthNotifier(ref.read(supabaseProvider));
});

final currentProfileProvider = FutureProvider<Profile?>((ref) async {
  final authState = ref.watch(authProvider);
  final user = authState.value;
  if (user == null) return null;

  final supabase = ref.read(supabaseProvider);
  try {
    final res = await supabase.from('profiles').select().eq('id', user.id).maybeSingle();
    if (res != null) {
      return Profile.fromJson(res);
    }
  } catch (_) {}

  // Fallback: Check user metadata
  final metaRole = (user.userMetadata?['role'] as String?) ?? 'citizen';
  final metaName = (user.userMetadata?['full_name'] as String?) ?? '';
  final metaDept = (user.userMetadata?['department'] as String?);
  return Profile(
    id: user.id,
    role: metaRole,
    fullName: metaName,
    department: metaDept,
    trustScore: 1.0,
    createdAt: DateTime.now(),
  );
});

class AuthNotifier extends StateNotifier<AsyncValue<User?>> {
  final SupabaseClient _supabase;

  AuthNotifier(this._supabase) : super(const AsyncValue.loading()) {
    _init();
  }

  void _init() {
    state = AsyncValue.data(_supabase.auth.currentUser);
    _supabase.auth.onAuthStateChange.listen((data) {
      state = AsyncValue.data(data.session?.user);
    });
  }

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      await _supabase.auth.signInWithPassword(email: email, password: password);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> signUp(
    String email,
    String password,
    String fullName, {
    String role = 'citizen',
    String? department,
  }) async {
    state = const AsyncValue.loading();
    try {
      final dataMap = <String, dynamic>{
        'full_name': fullName,
        'role': role,
      };
      if (department != null && department.isNotEmpty) {
        dataMap['department'] = department;
      }

      final res = await _supabase.auth.signUp(
        email: email,
        password: password,
        data: dataMap,
      );

      // Upsert profile record in case trigger is delayed or RLS is permissive
      if (res.user != null) {
        try {
          final profileMap = <String, dynamic>{
            'id': res.user!.id,
            'full_name': fullName,
            'role': role,
          };
          if (department != null && department.isNotEmpty) {
            profileMap['department'] = department;
          }
          await _supabase.from('profiles').upsert(profileMap);
        } catch (_) {}
      }
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> logout() async {
    await _supabase.auth.signOut();
  }
}
