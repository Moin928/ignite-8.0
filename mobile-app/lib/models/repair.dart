class Repair {
  final String id;
  final String issueId;
  final String workerId;
  final String afterImageUrl;
  final String? notes;
  final DateTime? repairedAt;
  final DateTime? createdAt;

  Repair({
    required this.id,
    required this.issueId,
    required this.workerId,
    required this.afterImageUrl,
    this.notes,
    this.repairedAt,
    this.createdAt,
  });

  factory Repair.fromJson(Map<String, dynamic> json) {
    return Repair(
      id: json['id']?.toString() ?? '',
      issueId: json['issue_id']?.toString() ?? '',
      workerId: json['worker_id']?.toString() ?? '',
      afterImageUrl: json['after_image_url'] ?? '',
      notes: json['notes'],
      repairedAt: json['repaired_at'] != null ? DateTime.parse(json['repaired_at']) : null,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'issue_id': issueId,
      'worker_id': workerId,
      'after_image_url': afterImageUrl,
      'notes': notes,
      'repaired_at': repairedAt?.toIso8601String(),
      'created_at': createdAt?.toIso8601String(),
    };
  }
}
