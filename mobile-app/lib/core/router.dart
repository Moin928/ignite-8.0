import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:civic_app/features/auth/login_screen.dart';
import 'package:civic_app/features/auth/signup_screen.dart';
import 'package:civic_app/features/home/home_screen.dart';
import 'package:civic_app/features/worker/worker_dashboard_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final session = Supabase.instance.client.auth.currentSession;
      final isAuth = session != null;
      final isLoggingIn = state.matchedLocation == '/login' || state.matchedLocation == '/signup';

      if (!isAuth && !isLoggingIn) return '/login';

      if (isAuth) {
        final role = (session.user.userMetadata?['role'] as String?)?.toLowerCase();
        final isWorker = role == 'worker';

        if (isLoggingIn) {
          return isWorker ? '/worker' : '/';
        }

        // Prevent worker from accessing citizen root or vice versa if navigated manually
        if (isWorker && state.matchedLocation == '/') {
          return '/worker';
        }
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const SignupScreen(),
      ),
      GoRoute(
        path: '/',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/worker',
        builder: (context, state) => const WorkerDashboardScreen(),
      ),
    ],
  );
});
