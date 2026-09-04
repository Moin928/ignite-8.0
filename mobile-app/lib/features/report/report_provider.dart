import 'dart:io';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cloudinary_public/cloudinary_public.dart';
import 'package:civic_app/core/supabase_provider.dart';
import 'package:civic_app/core/env.dart';

class SpamPhotoException implements Exception {
  final String reason;
  SpamPhotoException(this.reason);
  @override
  String toString() => reason;
}

class AiVerificationResult {
  final bool isSpam;
  final String? spamReason;
  final String? category;
  final double? confidence;
  final double? priorityScore;

  AiVerificationResult({
    required this.isSpam,
    this.spamReason,
    this.category,
    this.confidence,
    this.priorityScore,
  });
}

final reportProvider = Provider<ReportService>((ref) {
  return ReportService(ref.read(supabaseProvider));
});

class ReportService {
  final SupabaseClient _supabase;

  ReportService(this._supabase);

  Future<void> submitReport({
    required String title,
    required String category,
    required String severity,
    required String description,
    required File imageFile,
    required double lat,
    required double lng,
  }) async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw Exception("User not logged in");

    // 1. Upload image to Cloudinary (unsigned upload preset)
    debugPrint("Uploading photo to Cloudinary...");
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

    final imageUrl = response.secureUrl;
    debugPrint("Cloudinary photo uploaded: $imageUrl");

    // 2. AI Pre-Submission Verification (Fast check against food, selfie, indoor, meme)
    AiVerificationResult? aiResult;
    try {
      final aiUrl = Env.aiEndpointUrl;
      if (aiUrl.isNotEmpty) {
        debugPrint("Calling AI verification service: $aiUrl");
        final aiRes = await http.post(
          Uri.parse(aiUrl),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'image_url': imageUrl,
            'description': description.trim(),
          }),
        ).timeout(const Duration(seconds: 8));

        if (aiRes.statusCode == 200) {
          final data = jsonDecode(aiRes.body) as Map<String, dynamic>;
          debugPrint("AI Service Response: $data");

          final isSpam = data['is_spam'] == true;
          final spamReason = data['spam_reason'] as String?;

          if (isSpam) {
            final reason = spamReason ?? "Flagged as non-civic upload (Selfie / Food / Indoor / Irrelevant content detected)";
            debugPrint("Rejecting submission: $reason");
            throw SpamPhotoException(reason);
          }

          final priorityObj = data['priority'] as Map<String, dynamic>?;
          final priorityScore = (priorityObj?['priority_score'] as num?)?.toDouble();

          aiResult = AiVerificationResult(
            isSpam: false,
            category: data['category'] as String?,
            confidence: (data['confidence'] as num?)?.toDouble(),
            priorityScore: priorityScore,
          );
        } else {
          debugPrint("AI service returned status ${aiRes.statusCode}: ${aiRes.body}");
        }
      }
    } on SpamPhotoException {
      rethrow;
    } catch (e) {
      debugPrint("AI Verification service unreachable / bypassed: $e");
      // If AI service is offline or timeout, proceed so reporting does not hard block
    }

    // 3. PostGIS POINT format: POINT(lng lat)
    final locationPoint = 'POINT($lng $lat)';

    // 4. Insert issue with severity and title
    final issueCategory = (aiResult?.category != null && aiResult!.category != 'other')
        ? aiResult.category!
        : category;

    final issueRes = await _supabase.from('issues').insert({
      'title': title.trim().isNotEmpty ? title.trim() : '$issueCategory Issue',
      'description': description.trim(),
      'category': issueCategory,
      'severity': severity.toLowerCase(),
      'priority_score': aiResult?.priorityScore ?? 0.0,
      'location': locationPoint,
      'status': 'reported',
      'report_count': 1,
    }).select('id').single();

    final issueId = issueRes['id'];

    // 5. Insert report linked to the issue
    await _supabase.from('reports').insert({
      'issue_id': issueId,
      'citizen_id': user.id,
      'image_url': imageUrl,
      'description': description.trim(),
      'location': locationPoint,
      'is_spam': false,
      'ai_confidence': aiResult?.confidence ?? 0.95,
    });

    debugPrint("Issue #$issueId submitted successfully to Supabase.");
  }
}
