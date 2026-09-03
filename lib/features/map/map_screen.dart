import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:civic_app/features/map/map_provider.dart';
import 'package:civic_app/features/profile/profile_provider.dart';
import 'package:civic_app/core/env.dart';
import 'package:civic_app/core/image_viewer.dart';
import 'package:civic_app/models/issue.dart';

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  LatLng? _userLocation;
  bool _isLoadingLocation = true;
  bool _isMapMode = true; // true = Map view, false = List view
  final MapController _mapController = MapController();

  @override
  void initState() {
    super.initState();
    _fetchUserLocation();
  }

  Future<void> _fetchUserLocation() async {
    setState(() => _isLoadingLocation = true);
    try {
      var status = await Permission.location.request();
      if (status.isGranted) {
        final position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: Duration(seconds: 10),
          ),
        );
        if (mounted) {
          final userLatLng = LatLng(position.latitude, position.longitude);
          setState(() {
            _userLocation = userLatLng;
            _isLoadingLocation = false;
          });
          try {
            _mapController.move(userLatLng, 14.5);
          } catch (_) {}
        }
      } else {
        final lastKnown = await Geolocator.getLastKnownPosition();
        if (lastKnown != null && mounted) {
          setState(() {
            _userLocation = LatLng(lastKnown.latitude, lastKnown.longitude);
            _isLoadingLocation = false;
          });
        } else if (mounted) {
          setState(() {
            _userLocation = const LatLng(28.6139, 77.2090);
            _isLoadingLocation = false;
          });
        }
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _userLocation = const LatLng(28.6139, 77.2090);
          _isLoadingLocation = false;
        });
      }
    }
  }

  double? _calculateDistanceInMeters(Issue issue) {
    if (_userLocation == null || issue.lat == null || issue.lng == null) return null;
    return Geolocator.distanceBetween(
      _userLocation!.latitude,
      _userLocation!.longitude,
      issue.lat!,
      issue.lng!,
    );
  }

  String _formatDistance(double? meters) {
    if (meters == null) return '';
    if (meters < 1000) {
      return '${meters.round()} m away';
    }
    return '${(meters / 1000).toStringAsFixed(1)} km away';
  }

  Color _getSeverityColor(String severity) {
    switch (severity.toLowerCase()) {
      case 'high':
        return const Color(0xFFEF4444);
      case 'medium':
        return const Color(0xFFF59E0B);
      case 'low':
      default:
        return const Color(0xFF10B981);
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase().replaceAll(' ', '_')) {
      case 'resolved':
        return const Color(0xFF10B981);
      case 'in_progress':
        return const Color(0xFFF59E0B);
      case 'acknowledged':
        return const Color(0xFF8B5CF6);
      case 'rejected':
        return const Color(0xFFEF4444);
      case 'reported':
      default:
        return const Color(0xFF3B82F6);
    }
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase().replaceAll(' ', '_')) {
      case 'pothole':
        return Icons.remove_road_rounded;
      case 'garbage':
        return Icons.delete_outline;
      case 'broken_streetlight':
        return Icons.lightbulb_outline;
      case 'water_leakage':
        return Icons.water_drop_outlined;
      case 'road_damage':
        return Icons.construction_outlined;
      default:
        return Icons.report_problem_outlined;
    }
  }

  String _formatStatusLabel(String status) {
    switch (status.toLowerCase().replaceAll(' ', '_')) {
      case 'in_progress':
        return 'In Progress';
      case 'acknowledged':
        return 'Acknowledged';
      case 'resolved':
        return 'Resolved';
      case 'rejected':
        return 'Rejected';
      case 'reported':
      default:
        return 'Reported';
    }
  }

  String _formatDateTime(DateTime? dt) {
    if (dt == null) return '';
    final local = dt.toLocal();
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final hour = local.hour.toString().padLeft(2, '0');
    final min = local.minute.toString().padLeft(2, '0');
    return '${months[local.month - 1]} ${local.day}, ${local.year} at $hour:$min';
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFFF59E0B);
    final issuesAsync = ref.watch(issuesProvider);
    final userReportedIds = ref.watch(userReportedIssueIdsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: primaryColor.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.explore_rounded, color: primaryColor, size: 22),
            ),
            const SizedBox(width: 10),
            const Text(
              'Civic Issues',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: Color(0xFF0F172A)),
            ),
          ],
        ),
        actions: [
          // Mode toggle (Map vs List)
          Container(
            margin: const EdgeInsets.only(right: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(10),
            ),
            padding: const EdgeInsets.all(3),
            child: Row(
              children: [
                _buildToggleButton(
                  icon: Icons.map_rounded,
                  label: 'Map',
                  isSelected: _isMapMode,
                  onTap: () => setState(() => _isMapMode = true),
                ),
                _buildToggleButton(
                  icon: Icons.format_list_bulleted_rounded,
                  label: 'List',
                  isSelected: !_isMapMode,
                  onTap: () => setState(() => _isMapMode = false),
                ),
              ],
            ),
          ),
        ],
      ),
      body: _isLoadingLocation && _userLocation == null
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: primaryColor),
                  SizedBox(height: 14),
                  Text('Pinpointing your location...', style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
                ],
              ),
            )
          : issuesAsync.when(
              data: (issues) {
                if (_isMapMode) {
                  return _buildMapView(issues, userReportedIds);
                } else {
                  return _buildListView(issues, userReportedIds);
                }
              },
              loading: () => const Center(
                child: CircularProgressIndicator(color: primaryColor),
              ),
              error: (e, _) => Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline_rounded, color: Colors.red, size: 40),
                    const SizedBox(height: 12),
                    Text('Failed to load issues: $e', style: const TextStyle(color: Color(0xFF64748B))),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: () => ref.read(issuesProvider.notifier).fetchIssues(),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildToggleButton({
    required IconData icon,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          boxShadow: isSelected
              ? [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 4, offset: const Offset(0, 2))]
              : null,
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? const Color(0xFF0F172A) : const Color(0xFF64748B),
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? const Color(0xFF0F172A) : const Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMapView(List<Issue> issues, Set<String> userReportedIds) {
    final center = _userLocation ?? const LatLng(28.6139, 77.2090);

    final markers = <Marker>[];

    for (final issue in issues) {
      if (issue.lat == null || issue.lng == null) continue;
      final lat = issue.lat!;
      final lng = issue.lng!;
      final severityColor = _getSeverityColor(issue.severity);
      final isUserReport = userReportedIds.contains(issue.id);

      markers.add(
        Marker(
          width: 50.0,
          height: 50.0,
          point: LatLng(lat, lng),
          child: GestureDetector(
            onTap: () => _showIssueDetailModal(context, issue, isUserReport),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: severityColor.withValues(alpha: 0.25),
                    shape: BoxShape.circle,
                  ),
                ),
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: severityColor,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2.5),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withValues(alpha: 0.25), blurRadius: 6, offset: const Offset(0, 3)),
                    ],
                  ),
                  child: Icon(_getCategoryIcon(issue.category), color: Colors.white, size: 18),
                ),
                if (isUserReport)
                  Positioned(
                    top: 2,
                    right: 2,
                    child: Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: const Color(0xFF3B82F6),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      );
    }

    if (_userLocation != null) {
      markers.add(
        Marker(
          width: 30.0,
          height: 30.0,
          point: _userLocation!,
          child: Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: const Color(0xFF3B82F6).withValues(alpha: 0.3),
                  shape: BoxShape.circle,
                ),
              ),
              Container(
                width: 16,
                height: 16,
                decoration: BoxDecoration(
                  color: const Color(0xFF3B82F6),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2.5),
                  boxShadow: [
                    BoxShadow(color: const Color(0xFF3B82F6).withValues(alpha: 0.5), blurRadius: 8),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Stack(
      children: [
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: center,
            initialZoom: 14.5,
          ),
          children: [
            TileLayer(
              urlTemplate: "https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token={accessToken}",
              additionalOptions: {
                'accessToken': Env.mapboxToken,
              },
            ),
            MarkerLayer(markers: markers),
          ],
        ),

        // Quick Legend Badge
        Positioned(
          top: 12,
          left: 14,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.95),
              borderRadius: BorderRadius.circular(10),
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 8),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildLegendItem(const Color(0xFFEF4444), 'High'),
                const SizedBox(width: 8),
                _buildLegendItem(const Color(0xFFF59E0B), 'Med'),
                const SizedBox(width: 8),
                _buildLegendItem(const Color(0xFF10B981), 'Low'),
              ],
            ),
          ),
        ),

        // Live Issues Count Badge
        Positioned(
          top: 12,
          right: 14,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.15), blurRadius: 6),
              ],
            ),
            child: Text(
              '${issues.where((i) => i.lat != null && i.lng != null).length} Markers',
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
            ),
          ),
        ),

        // Floating Recenter Button
        Positioned(
          bottom: 20,
          right: 16,
          child: FloatingActionButton.small(
            backgroundColor: Colors.white,
            foregroundColor: const Color(0xFF0F172A),
            elevation: 3,
            onPressed: () {
              if (_userLocation != null) {
                _mapController.move(_userLocation!, 15.0);
              } else {
                _fetchUserLocation();
              }
            },
            child: const Icon(Icons.my_location_rounded),
          ),
        ),
      ],
    );
  }

  Widget _buildLegendItem(Color color, String label) {
    return Row(
      children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF334155))),
      ],
    );
  }

  Widget _buildListView(List<Issue> issues, Set<String> userReportedIds) {
    final sortedIssues = List<Issue>.from(issues);
    if (_userLocation != null) {
      sortedIssues.sort((a, b) {
        final distA = _calculateDistanceInMeters(a) ?? double.infinity;
        final distB = _calculateDistanceInMeters(b) ?? double.infinity;
        return distA.compareTo(distB);
      });
    }

    final displayIssues = sortedIssues.take(10).toList();

    if (displayIssues.isEmpty) {
      return RefreshIndicator(
        onRefresh: () async => ref.read(issuesProvider.notifier).fetchIssues(),
        child: ListView(
          children: const [
            SizedBox(height: 120),
            Center(
              child: Column(
                children: [
                  Icon(Icons.check_circle_outline_rounded, size: 64, color: Color(0xFF10B981)),
                  SizedBox(height: 12),
                  Text('No issues reported nearby!', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  SizedBox(height: 4),
                  Text('Your area is safe and clean.', style: TextStyle(color: Color(0xFF64748B))),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async => ref.read(issuesProvider.notifier).fetchIssues(),
      color: const Color(0xFFF59E0B),
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        itemCount: displayIssues.length,
        separatorBuilder: (_, _) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final issue = displayIssues[index];
          final distanceStr = _formatDistance(_calculateDistanceInMeters(issue));
          final severityColor = _getSeverityColor(issue.severity);
          final statusColor = _getStatusColor(issue.status);
          final isUserReport = userReportedIds.contains(issue.id);

          return InkWell(
            onTap: () => _showIssueDetailModal(context, issue, isUserReport),
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isUserReport ? const Color(0xFF3B82F6).withValues(alpha: 0.4) : const Color(0xFFE2E8F0),
                  width: isUserReport ? 1.5 : 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Photo thumbnail or category icon
                  if (issue.imageUrl != null && issue.imageUrl!.isNotEmpty)
                    GestureDetector(
                      onTap: () => FullScreenImageViewer.open(context, issue.imageUrl!, title: issue.title),
                      child: Stack(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: CachedNetworkImage(
                              imageUrl: issue.imageUrl!,
                              width: 76,
                              height: 76,
                              fit: BoxFit.cover,
                              placeholder: (context, url) => Container(
                                width: 76,
                                height: 76,
                                color: const Color(0xFFF1F5F9),
                                child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                              ),
                              errorWidget: (context, url, error) => Container(
                                width: 76,
                                height: 76,
                                color: const Color(0xFFF1F5F9),
                                child: Icon(_getCategoryIcon(issue.category), color: const Color(0xFF64748B)),
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: 4,
                            right: 4,
                            child: Container(
                              padding: const EdgeInsets.all(3),
                              decoration: BoxDecoration(
                                color: Colors.black.withValues(alpha: 0.6),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.fullscreen_rounded, color: Colors.white, size: 12),
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    Container(
                      width: 50,
                      height: 50,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Icon(_getCategoryIcon(issue.category), color: const Color(0xFF475569), size: 24),
                    ),

                  const SizedBox(width: 14),

                  // Info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                issue.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF0F172A)),
                              ),
                            ),
                            const SizedBox(width: 6),
                            // Severity badge
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                              decoration: BoxDecoration(
                                color: severityColor.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                issue.severity.toUpperCase(),
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  color: severityColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 3),
                        Row(
                          children: [
                            Text(
                              issue.category.replaceAll('_', ' ').toUpperCase(),
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF94A3B8), letterSpacing: 0.5),
                            ),
                            if (isUserReport) ...[
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF3B82F6).withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text('YOUR REPORT', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Color(0xFF2563EB))),
                              ),
                            ],
                          ],
                        ),

                        if (issue.description != null && issue.description!.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Text(
                            issue.description!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 12, color: Color(0xFF475569)),
                          ),
                        ],

                        const SizedBox(height: 10),

                        // Status pill + distance
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: statusColor.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(width: 5, height: 5, decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle)),
                                  const SizedBox(width: 5),
                                  Text(
                                    _formatStatusLabel(issue.status),
                                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: statusColor),
                                  ),
                                ],
                              ),
                            ),
                            if (distanceStr.isNotEmpty)
                              Row(
                                children: [
                                  const Icon(Icons.near_me_rounded, size: 12, color: Color(0xFF0F172A)),
                                  const SizedBox(width: 3),
                                  Text(distanceStr, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                                ],
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _showIssueDetailModal(BuildContext context, Issue issue, bool isUserReport) {
    final statusColor = _getStatusColor(issue.status);
    final severityColor = _getSeverityColor(issue.severity);
    final distanceStr = _formatDistance(_calculateDistanceInMeters(issue));

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.75,
        maxChildSize: 0.95,
        minChildSize: 0.45,
        expand: false,
        builder: (_, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 18),

              // Title and Category Icon
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(_getCategoryIcon(issue.category), color: const Color(0xFFD97706), size: 28),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          issue.title,
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Category: ${issue.category.replaceAll('_', ' ')}',
                          style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 18),

              // Photo Section (Clickable to view full screen)
              if (issue.imageUrl != null && issue.imageUrl!.isNotEmpty) ...[
                GestureDetector(
                  onTap: () => FullScreenImageViewer.open(context, issue.imageUrl!, title: issue.title),
                  child: Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: CachedNetworkImage(
                          imageUrl: issue.imageUrl!,
                          height: 200,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Container(
                            height: 200,
                            color: const Color(0xFFF1F5F9),
                            child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                          ),
                          errorWidget: (context, url, error) => Container(
                            height: 200,
                            color: const Color(0xFFF1F5F9),
                            child: const Center(child: Icon(Icons.broken_image_rounded, size: 40, color: Color(0xFF94A3B8))),
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 10,
                        right: 10,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.7),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.zoom_in_rounded, color: Colors.white, size: 16),
                              SizedBox(width: 4),
                              Text('Tap to enlarge', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
              ],

              // Status & Severity Badges Grid
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: statusColor.withValues(alpha: 0.2)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('GOVERNMENT STATUS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                          const SizedBox(height: 4),
                          Text(
                            _formatStatusLabel(issue.status),
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: statusColor),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: severityColor.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: severityColor.withValues(alpha: 0.2)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('SEVERITY LEVEL', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                          const SizedBox(height: 4),
                          Text(
                            issue.severity.toUpperCase(),
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: severityColor),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 18),

              // Description Section
              const Text('Description', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
              const SizedBox(height: 6),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Text(
                  issue.description != null && issue.description!.isNotEmpty
                      ? issue.description!
                      : 'No additional description provided.',
                  style: const TextStyle(fontSize: 14, color: Color(0xFF334155), height: 1.4),
                ),
              ),

              const SizedBox(height: 18),

              // Location & Stats info
              if (issue.lat != null && issue.lng != null) ...[
                const Text('Location Details', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.pin_drop_rounded, color: Color(0xFFEF4444), size: 20),
                          const SizedBox(width: 8),
                          Text('Coordinates: ${issue.lat!.toStringAsFixed(5)}, ${issue.lng!.toStringAsFixed(5)}',
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF334155))),
                        ],
                      ),
                      if (distanceStr.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.navigation_rounded, color: Color(0xFF3B82F6), size: 18),
                            const SizedBox(width: 8),
                            Text('Distance from you: $distanceStr', style: const TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                          ],
                        ),
                      ],
                      if (issue.updatedAt != null) ...[
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.update_rounded, color: Color(0xFF10B981), size: 18),
                            const SizedBox(width: 8),
                            Text('Last Status Update: ${_formatDateTime(issue.updatedAt)}', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 24),

              // Support / Affected Button OR Reporter Badge
              if (isUserReport)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF3B82F6).withValues(alpha: 0.3)),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.check_circle_rounded, color: Color(0xFF2563EB), size: 18),
                      SizedBox(width: 8),
                      Text('You reported this issue', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF2563EB))),
                    ],
                  ),
                )
              else
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Support recorded! You are marked as affected by this issue.'),
                          backgroundColor: Color(0xFF10B981),
                        ),
                      );
                    },
                    icon: const Icon(Icons.thumb_up_alt_rounded, size: 18, color: Color(0xFF0F172A)),
                    label: const Text('I am also affected', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFF59E0B),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
