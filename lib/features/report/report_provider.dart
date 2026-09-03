import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cloudinary_public/cloudinary_public.dart';
import 'package:civic_app/core/supabase_provider.dart';
import 'package:civic_app/core/env.dart';

final reportProvider = Provider<ReportService>((ref) {
  return ReportService(ref.read(supabaseProvider));
});

class ReportService {
  final SupabaseClient _supabase;

  ReportService(this._supabase);

  Future<void> submitReport({
    required String category,
    required String description,
    required File imageFile,
    required double lat,
    required double lng,
  }) async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw Exception("User not logged in");

    // 1. Upload image to Cloudinary (unsigned upload preset)
    final cloudinary = CloudinaryPublic(
      Env.cloudinaryCloudName,
      Env.cloudinaryUploadPreset,
      cache: false,
    );

    final response = await cloudinary.uploadFile(
      CloudinaryFile.fromFile(
        imageFile.path,
        folder: 'civic_reports',
        resourceType: CloudinaryResourceType.Image,
      ),
    );

    final imageUrl = response.secureUrl; // HTTPS URL stored in Supabase

    // 2. PostGIS POINT format: POINT(lng lat)
    final locationPoint = 'POINT($lng $lat)';

    // 3. Insert issue
    final issueRes = await _supabase.from('issues').insert({
      'title': '$category Issue',
      'description': description,
      'category': category,
      'location': locationPoint,
      'status': 'reported',
      'report_count': 1,
    }).select('id').single();

    final issueId = issueRes['id'];

    // 4. Insert report linked to the issue — image_url is the Cloudinary URL
    await _supabase.from('reports').insert({
      'issue_id': issueId,
      'citizen_id': user.id,
      'image_url': imageUrl,
      'description': description,
      'location': locationPoint,
    });
  }
}
