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
  });

  factory Report.fromJson(Map<String, dynamic> json) {
    return Report(
      id: json['id'],
      issueId: json['issue_id'],
      citizenId: json['citizen_id'],
      imageUrl: json['image_url'],
      description: json['description'],
      location: json['location'],
      isSpam: json['is_spam'] ?? false,
      aiConfidence: (json['ai_confidence'] as num?)?.toDouble(),
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
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
    };
  }
}
