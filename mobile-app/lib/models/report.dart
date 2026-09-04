import 'package:civic_app/models/issue.dart';

class Report {
  final String id;
  final String? issueId;
  final String? citizenId;
  final String imageUrl;
  final String? description;
  final dynamic location;
  final bool isSpam;
  final double? aiConfidence;
  final DateTime? createdAt;
  final Issue? issue; // Linked issue with status, title, severity

  Report({
    required this.id,
    this.issueId,
    this.citizenId,
    required this.imageUrl,
    this.description,
    required this.location,
    required this.isSpam,
    this.aiConfidence,
    this.createdAt,
    this.issue,
  });

  Report copyWith({
    String? id,
    String? issueId,
    String? citizenId,
    String? imageUrl,
    String? description,
    dynamic location,
    bool? isSpam,
    double? aiConfidence,
    DateTime? createdAt,
    Issue? issue,
  }) {
    return Report(
      id: id ?? this.id,
      issueId: issueId ?? this.issueId,
      citizenId: citizenId ?? this.citizenId,
      imageUrl: imageUrl ?? this.imageUrl,
      description: description ?? this.description,
      location: location ?? this.location,
      isSpam: isSpam ?? this.isSpam,
      aiConfidence: aiConfidence ?? this.aiConfidence,
      createdAt: createdAt ?? this.createdAt,
      issue: issue ?? this.issue,
    );
  }

  factory Report.fromJson(Map<String, dynamic> json) {
    return Report(
      id: json['id'],
      issueId: json['issue_id'],
      citizenId: json['citizen_id'],
      imageUrl: json['image_url'] ?? '',
      description: json['description'],
      location: json['location'],
      isSpam: json['is_spam'] ?? false,
      aiConfidence: (json['ai_confidence'] as num?)?.toDouble(),
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      issue: json['issues'] != null
          ? Issue.fromJson(json['issues'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'issue_id': issueId,
      'citizen_id': citizenId,
      'image_url': imageUrl,
      'description': description,
      'location': location,
      'is_spam': isSpam,
      'ai_confidence': aiConfidence,
      'created_at': createdAt?.toIso8601String(),
      'issues': issue?.toJson(),
    };
  }
}
