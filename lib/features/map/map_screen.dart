import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:civic_app/features/map/map_provider.dart';
import 'package:civic_app/core/env.dart';

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  LatLng? _currentLocation;

  @override
  void initState() {
    super.initState();
    _getLocation();
  }

  Future<void> _getLocation() async {
    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.low,
      );
      if (mounted) {
        setState(() {
          _currentLocation = LatLng(position.latitude, position.longitude);
        });
      }
    } catch (e) {
      // Handle location error, fallback to default (e.g. London)
      if (mounted) {
        setState(() {
          _currentLocation = const LatLng(51.5, -0.09);
        });
      }
    }
  }

  Color _getPriorityColor(double score) {
    if (score >= 0.7) return Colors.red;
    if (score >= 0.4) return Colors.orange;
    return Colors.green;
  }

  @override
  Widget build(BuildContext context) {
    final issuesAsync = ref.watch(issuesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Nearby Issues'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.refresh(issuesProvider),
          )
        ],
      ),
      body: _currentLocation == null
          ? const Center(child: CircularProgressIndicator())
          : FlutterMap(
              options: MapOptions(
                initialCenter: _currentLocation!,
                initialZoom: 13.0,
              ),
              children: [
                TileLayer(
                  urlTemplate: "https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token={accessToken}",
                  additionalOptions: {
                    'accessToken': Env.mapboxToken,
                  },
                ),
                issuesAsync.when(
                  data: (issues) {
                    final markers = issues.where((i) => i.location != null && i.location is Map).map((issue) {
                      final lat = (issue.location as Map)['lat'] as double;
                      final lng = (issue.location as Map)['lng'] as double;
                      
                      return Marker(
                        width: 40.0,
                        height: 40.0,
                        point: LatLng(lat, lng),
                        child: GestureDetector(
                          onTap: () {
                            showModalBottomSheet(
                              context: context,
                              builder: (ctx) => Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(issue.title, style: Theme.of(context).textTheme.titleLarge),
                                    const SizedBox(height: 8),
                                    Text('Category: ${issue.category}'),
                                    Text('Status: ${issue.status}'),
                                    const SizedBox(height: 8),
                                    Text(issue.description ?? 'No description'),
                                  ],
                                ),
                              ),
                            );
                          },
                          child: Icon(
                            Icons.location_on,
                            color: _getPriorityColor(issue.priorityScore),
                            size: 40.0,
                          ),
                        ),
                      );
                    }).toList();

                    return MarkerLayer(markers: markers);
                  },
                  loading: () => const MarkerLayer(markers: []),
                  error: (_, _) => const MarkerLayer(markers: []),
                ),
              ],
            ),
    );
  }
}
