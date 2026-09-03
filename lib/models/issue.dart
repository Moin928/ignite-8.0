class Issue {
  final String id;
  final String title;
  final String? description;
  final String category;
  final String status;
  final String severity;
  final double priorityScore;
  final dynamic location;
  final String? assignedWorkerId;
  final int reportCount;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Issue({
    required this.id,
    required this.title,
    this.description,
    required this.category,
    required this.status,
    required this.severity,
    required this.priorityScore,
    required this.location,
    this.assignedWorkerId,
    required this.reportCount,
    this.createdAt,
    this.updatedAt,
  });

  double? get lat => location is Map ? (location as Map)['lat'] as double? : null;
  double? get lng => location is Map ? (location as Map)['lng'] as double? : null;

  factory Issue.fromJson(Map<String, dynamic> json) {
    dynamic parsedLocation;
    if (json['location'] != null) {
      final locStr = json['location'].toString();
      if (locStr.startsWith('POINT(')) {
        final coords = locStr
            .replaceAll('POINT(', '')
            .replaceAll(')', '')
            .split(' ');
        if (coords.length == 2) {
          parsedLocation = {
            'lng': double.parse(coords[0]),
            'lat': double.parse(coords[1]),
          };
        }
      } else {
        parsedLocation = json['location'];
      }
    }

    return Issue(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      category: json['category'] ?? 'other',
      status: json['status'] ?? 'reported',
      severity: json['severity'] ?? 'low',
      priorityScore: (json['priority_score'] as num?)?.toDouble() ?? 0.0,
      location: parsedLocation,
      assignedWorkerId: json['assigned_worker_id'],
      reportCount: json['report_count'] ?? 1,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'category': category,
      'status': status,
      'severity': severity,
      'priority_score': priorityScore,
      'location': location,
      'assigned_worker_id': assignedWorkerId,
      'report_count': reportCount,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }
}
