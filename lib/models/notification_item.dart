class NotificationItem {
  final String id;
  final String citizenId;
  final String? issueId;
  final String type; // 'evidence_requested', 'assigned', 'in_progress', 'repaired', 'resolved', 'rejected', 'status_update'
  final String title;
  final String message;
  final bool isRead;
  final bool actionRequired;
  final bool actionCompleted;
  final String? evidenceImageUrl;
  final DateTime? createdAt;

  NotificationItem({
    required this.id,
    required this.citizenId,
    this.issueId,
    required this.type,
    required this.title,
    required this.message,
    this.isRead = false,
    this.actionRequired = false,
    this.actionCompleted = false,
    this.evidenceImageUrl,
    this.createdAt,
  });

  NotificationItem copyWith({
    String? id,
    String? citizenId,
    String? issueId,
    String? type,
    String? title,
    String? message,
    bool? isRead,
    bool? actionRequired,
    bool? actionCompleted,
    String? evidenceImageUrl,
    DateTime? createdAt,
  }) {
    return NotificationItem(
      id: id ?? this.id,
      citizenId: citizenId ?? this.citizenId,
      issueId: issueId ?? this.issueId,
      type: type ?? this.type,
      title: title ?? this.title,
      message: message ?? this.message,
      isRead: isRead ?? this.isRead,
      actionRequired: actionRequired ?? this.actionRequired,
      actionCompleted: actionCompleted ?? this.actionCompleted,
      evidenceImageUrl: evidenceImageUrl ?? this.evidenceImageUrl,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: json['id']?.toString() ?? '',
      citizenId: json['citizen_id']?.toString() ?? '',
      issueId: json['issue_id']?.toString(),
      type: json['type'] ?? 'status_update',
      title: json['title'] ?? 'Notification',
      message: json['message'] ?? '',
      isRead: json['is_read'] ?? false,
      actionRequired: json['action_required'] ?? false,
      actionCompleted: json['action_completed'] ?? false,
      evidenceImageUrl: json['evidence_image_url'],
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'citizen_id': citizenId,
      'issue_id': issueId,
      'type': type,
      'title': title,
      'message': message,
      'is_read': isRead,
      'action_required': actionRequired,
      'action_completed': actionCompleted,
      'evidence_image_url': evidenceImageUrl,
      'created_at': createdAt?.toIso8601String(),
    };
  }
}
