class Profile {
  final String id;
  final String role;
  final String? fullName;
  final String? phone;
  final String? department;
  final String? wardZone;
  final double trustScore;
  final DateTime? createdAt;

  Profile({
    required this.id,
    required this.role,
    this.fullName,
    this.phone,
    this.department,
    this.wardZone,
    required this.trustScore,
    this.createdAt,
  });

  Profile copyWith({
    String? id,
    String? role,
    String? fullName,
    String? phone,
    String? department,
    String? wardZone,
    double? trustScore,
    DateTime? createdAt,
  }) {
    return Profile(
      id: id ?? this.id,
      role: role ?? this.role,
      fullName: fullName ?? this.fullName,
      phone: phone ?? this.phone,
      department: department ?? this.department,
      wardZone: wardZone ?? this.wardZone,
      trustScore: trustScore ?? this.trustScore,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  factory Profile.fromJson(Map<String, dynamic> json) {
    return Profile(
      id: json['id']?.toString() ?? '',
      role: json['role'] ?? 'citizen',
      fullName: json['full_name'],
      phone: json['phone'],
      department: json['department'],
      wardZone: json['ward_zone'],
      trustScore: (json['trust_score'] as num?)?.toDouble() ?? 1.0,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'role': role,
      'full_name': fullName,
      'phone': phone,
      'department': department,
      'ward_zone': wardZone,
      'trust_score': trustScore,
      'created_at': createdAt?.toIso8601String(),
    };
  }
}
