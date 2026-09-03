class Profile {
  final String id;
  final String role;
  final String? fullName;
  final String? phone;
  final double trustScore;
  final DateTime? createdAt;

  Profile({
    required this.id,
    required this.role,
    this.fullName,
    this.phone,
    required this.trustScore,
    this.createdAt,
  });

  factory Profile.fromJson(Map<String, dynamic> json) {
    return Profile(
      id: json['id'],
      role: json['role'] ?? 'citizen',
      fullName: json['full_name'],
      phone: json['phone'],
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
      'trust_score': trustScore,
      'created_at': createdAt?.toIso8601String(),
    };
  }
}
