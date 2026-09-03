import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:civic_app/core/env.dart';
import 'package:civic_app/core/router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Env.init();
  
  await Supabase.initialize(
    url: Env.supabaseUrl,
    anonKey: Env.supabaseAnonKey,
  );

  runApp(
    const ProviderScope(
      child: MyApp(),
    ),
  );
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Civic App',
      debugShowCheckedModeBanner: true, 
      theme: ThemeData(
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFF59E0B),
          primary: const Color(0xFFF59E0B),
          surface: const Color(0xFFF8FAFC),
        ),
        useMaterial3: true,
      ),
      routerConfig: router,
    );
  }
}
