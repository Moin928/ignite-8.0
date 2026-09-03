import 'dart:typed_data';

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
  final String? imageUrl;

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
    this.imageUrl,
  });

  double? get lat => location is Map ? (location as Map)['lat'] as double? : null;
  double? get lng => location is Map ? (location as Map)['lng'] as double? : null;

  static Map<String, double>? parseLocation(dynamic loc) {
    if (loc == null) return null;

    if (loc is Map) {
      if (loc.containsKey('coordinates') && loc['coordinates'] is List) {
        final coords = loc['coordinates'] as List;
        if (coords.length >= 2) {
          return {
            'lng': (coords[0] as num).toDouble(),
            'lat': (coords[1] as num).toDouble(),
          };
        }
      }
      if (loc.containsKey('lat') && loc.containsKey('lng')) {
        return {
          'lat': (loc['lat'] as num).toDouble(),
          'lng': (loc['lng'] as num).toDouble(),
        };
      }
      if (loc.containsKey('latitude') && loc.containsKey('longitude')) {
        return {
          'lat': (loc['latitude'] as num).toDouble(),
          'lng': (loc['longitude'] as num).toDouble(),
        };
      }
    }

    final str = loc.toString().trim();

    // WKT like POINT(lng lat) or POINT (lng lat)
    final pointMatch = RegExp(
      r'POINT\s*\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)',
      caseSensitive: false,
    ).firstMatch(str);
    if (pointMatch != null) {
      final p1 = double.tryParse(pointMatch.group(1)!);
      final p2 = double.tryParse(pointMatch.group(2)!);
      if (p1 != null && p2 != null) {
        return {'lng': p1, 'lat': p2};
      }
    }

    // WKB / EWKB Hex string from PostGIS (e.g. 0101000020E6100000...)
    if (RegExp(r'^[0-9A-Fa-f]{32,}$').hasMatch(str)) {
      try {
        final bytes = <int>[];
        for (var i = 0; i < str.length; i += 2) {
          bytes.add(int.parse(str.substring(i, i + 2), radix: 16));
        }
        final byteData = ByteData.sublistView(Uint8List.fromList(bytes));
        final isLittleEndian = bytes[0] == 1;
        final endian = isLittleEndian ? Endian.little : Endian.big;
        final type = byteData.getUint32(1, endian);
        final hasSrid = (type & 0x20000000) != 0;
        final offset = hasSrid ? 9 : 5;
        if (bytes.length >= offset + 16) {
          final x = byteData.getFloat64(offset, endian); // lng
          final y = byteData.getFloat64(offset + 8, endian); // lat
          if (x >= -180 && x <= 180 && y >= -90 && y <= 90) {
            return {'lng': x, 'lat': y};
          }
        }
      } catch (_) {}
    }

    // General coordinate pair (e.g. "(77.2, 28.5)")
    final pairMatch = RegExp(r'\(?\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)?').firstMatch(str);
    if (pairMatch != null) {
      final p1 = double.tryParse(pairMatch.group(1)!);
      final p2 = double.tryParse(pairMatch.group(2)!);
      if (p1 != null && p2 != null) {
        return {'lng': p1, 'lat': p2};
      }
    }

    return null;
  }

  factory Issue.fromJson(Map<String, dynamic> json) {
    final parsedLocation = parseLocation(json['location']);

    String? parsedImageUrl;
    if (json['image_url'] != null) {
      parsedImageUrl = json['image_url'].toString();
    } else if (json['reports'] != null && json['reports'] is List && (json['reports'] as List).isNotEmpty) {
      final firstReport = (json['reports'] as List).first;
      if (firstReport is Map && firstReport['image_url'] != null) {
        parsedImageUrl = firstReport['image_url'].toString();
      }
    }

    return Issue(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? 'Civic Issue',
      description: json['description'],
      category: json['category'] ?? 'other',
      status: json['status'] ?? 'reported',
      severity: json['severity'] ?? 'low',
      priorityScore: (json['priority_score'] as num?)?.toDouble() ?? 0.0,
      location: parsedLocation,
      assignedWorkerId: json['assigned_worker_id']?.toString(),
      reportCount: json['report_count'] ?? 1,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
      imageUrl: parsedImageUrl,
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
      'image_url': imageUrl,
    };
  }
}
