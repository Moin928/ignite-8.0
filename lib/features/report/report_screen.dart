import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:permission_handler/permission_handler.dart';
import 'package:civic_app/features/report/report_provider.dart';

class ReportScreen extends ConsumerStatefulWidget {
  const ReportScreen({super.key});

  @override
  ConsumerState<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends ConsumerState<ReportScreen> {
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();

  File? _image;
  String _category = 'pothole';
  String _severity = 'medium'; // low, medium, high

  Position? _currentPosition;
  String? _currentAddress;
  bool _isFetchingLocation = false;
  bool _isLoading = false;

  final _speech = stt.SpeechToText();
  bool _isListening = false;

  final List<Map<String, dynamic>> _categoryOptions = [
    {
      'id': 'pothole',
      'label': 'Pothole',
      'icon': Icons.remove_road_rounded,
    },
    {
      'id': 'garbage',
      'label': 'Garbage',
      'icon': Icons.delete_outline,
    },
    {
      'id': 'broken_streetlight',
      'label': 'Streetlight',
      'icon': Icons.lightbulb_outline,
    },
    {
      'id': 'water_leakage',
      'label': 'Water Leak',
      'icon': Icons.water_drop_outlined,
    },
    {
      'id': 'road_damage',
      'label': 'Road Damage',
      'icon': Icons.construction_outlined,
    },
    {
      'id': 'other',
      'label': 'Other',
      'icon': Icons.report_problem_outlined,
    },
  ];

  @override
  void initState() {
    super.initState();
    _getLocation();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _speech.stop();
    super.dispose();
  }

  Future<void> _getLocation() async {
    setState(() => _isFetchingLocation = true);
    try {
      var status = await Permission.location.request();
      if (status.isGranted) {
        final position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
        );
        if (mounted) {
          setState(() => _currentPosition = position);
        }

        try {
          final placemarks = await placemarkFromCoordinates(
            position.latitude,
            position.longitude,
          );
          if (placemarks.isNotEmpty && mounted) {
            final place = placemarks.first;
            final street = place.street ?? '';
            final subLocality = place.subLocality ?? '';
            final locality = place.locality ?? '';
            final parts = [street, subLocality, locality].where((s) => s.isNotEmpty).toList();
            setState(() {
              _currentAddress = parts.isNotEmpty ? parts.join(', ') : 'Location captured';
            });
          }
        } catch (_) {
          if (mounted) {
            setState(() => _currentAddress = 'Coordinates: ${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}');
          }
        }
      } else if (mounted) {
        setState(() => _currentAddress = 'Location permission denied');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _currentAddress = 'Unable to fetch location');
      }
    } finally {
      if (mounted) {
        setState(() => _isFetchingLocation = false);
      }
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    final status = source == ImageSource.camera
        ? await Permission.camera.request()
        : await Permission.photos.request();

    if (status.isGranted || status.isLimited) {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 1920,
      );
      if (pickedFile != null && mounted) {
        setState(() {
          _image = File(pickedFile.path);
        });
      }
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Camera/Storage permission is required to capture photos.')),
      );
    }
  }

  Future<void> _listen() async {
    if (!_isListening) {
      var status = await Permission.microphone.request();
      if (status.isGranted) {
        bool available = await _speech.initialize(
          onError: (_) => setState(() => _isListening = false),
          onStatus: (status) {
            if (status == 'done' || status == 'notListening') {
              setState(() => _isListening = false);
            }
          },
        );
        if (available && mounted) {
          setState(() => _isListening = true);
          _speech.listen(
            onResult: (val) {
              if (mounted) {
                setState(() {
                  _descriptionController.text = val.recognizedWords;
                });
              }
            },
          );
        }
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Microphone permission is required for voice input.')),
        );
      }
    } else {
      setState(() => _isListening = false);
      _speech.stop();
    }
  }

  Future<void> _submit() async {
    final title = _titleController.text.trim();
    if (title.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an issue title/name.')),
      );
      return;
    }

    if (_image == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please attach a photo of the issue.')),
      );
      return;
    }

    if (_currentPosition == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please wait for GPS location or tap Refresh.')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      await ref.read(reportProvider).submitReport(
            title: title,
            category: _category,
            severity: _severity,
            description: _descriptionController.text,
            imageFile: _image!,
            lat: _currentPosition!.latitude,
            lng: _currentPosition!.longitude,
          );

      if (mounted) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            icon: const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 48),
            title: const Text('Report Submitted!'),
            content: const Text(
              'Thank you for reporting this issue. Municipal authorities have been notified and you can track updates in your profile.',
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  setState(() {
                    _titleController.clear();
                    _descriptionController.clear();
                    _image = null;
                    _category = 'pothole';
                    _severity = 'medium';
                  });
                },
                child: const Text('Done'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.red.shade700,
            content: Text('Failed to submit report: $e'),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFFF59E0B);

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
              child: const Icon(Icons.campaign_rounded, color: primaryColor, size: 22),
            ),
            const SizedBox(width: 10),
            const Text(
              'Report Issue',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: Color(0xFF0F172A)),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: primaryColor),
                  SizedBox(height: 16),
                  Text('Uploading report & image...', style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w500)),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // --- Issue Name / Title Input ---
                  const Text('Issue Title / Name', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF1E293B))),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: TextField(
                      controller: _titleController,
                      style: const TextStyle(fontSize: 15, color: Color(0xFF0F172A)),
                      decoration: const InputDecoration(
                        hintText: 'e.g. Deep Pothole on Main St.',
                        hintStyle: TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
                        prefixIcon: Icon(Icons.title_rounded, color: Color(0xFF94A3B8)),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // --- Category Selection ---
                  const Text('Select Category', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF1E293B))),
                  const SizedBox(height: 10),
                  GridView.builder(
                    physics: const NeverScrollableScrollPhysics(),
                    shrinkWrap: true,
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 10,
                      childAspectRatio: 1.15,
                    ),
                    itemCount: _categoryOptions.length,
                    itemBuilder: (context, index) {
                      final item = _categoryOptions[index];
                      final isSelected = _category == item['id'];
                      return InkWell(
                        onTap: () => setState(() => _category = item['id']),
                        borderRadius: BorderRadius.circular(12),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          decoration: BoxDecoration(
                            color: isSelected ? primaryColor.withValues(alpha: 0.12) : Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSelected ? primaryColor : const Color(0xFFE2E8F0),
                              width: isSelected ? 2 : 1,
                            ),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                item['icon'] as IconData,
                                color: isSelected ? const Color(0xFFD97706) : const Color(0xFF64748B),
                                size: 26,
                              ),
                              const SizedBox(height: 6),
                              Text(
                                item['label'],
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                  color: isSelected ? const Color(0xFF92400E) : const Color(0xFF334155),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 20),

                  // --- Severity Level ---
                  const Text('Severity Level', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF1E293B))),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      _buildSeverityOption(
                        id: 'low',
                        label: 'Low',
                        subtitle: 'Minor issue',
                        color: const Color(0xFF10B981),
                      ),
                      const SizedBox(width: 10),
                      _buildSeverityOption(
                        id: 'medium',
                        label: 'Medium',
                        subtitle: 'Needs attention',
                        color: const Color(0xFFF59E0B),
                      ),
                      const SizedBox(width: 10),
                      _buildSeverityOption(
                        id: 'high',
                        label: 'High',
                        subtitle: 'Urgent danger',
                        color: const Color(0xFFEF4444),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // --- Photo Attachment ---
                  const Text('Attach Photo', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF1E293B))),
                  const SizedBox(height: 10),
                  if (_image != null)
                    Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: Image.file(
                            _image!,
                            height: 190,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          ),
                        ),
                        Positioned(
                          top: 10,
                          right: 10,
                          child: InkWell(
                            onTap: () => setState(() => _image = null),
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: Colors.black.withValues(alpha: 0.65),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.close, color: Colors.white, size: 18),
                            ),
                          ),
                        ),
                      ],
                    )
                  else
                    InkWell(
                      onTap: () => _showPhotoPickerBottomSheet(context),
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        height: 130,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFCBD5E1), style: BorderStyle.solid),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: primaryColor.withValues(alpha: 0.12),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.add_a_photo_rounded, color: primaryColor, size: 28),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Take Photo or Upload',
                              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Color(0xFF334155)),
                            ),
                            const Text(
                              'Helps authorities locate and verify faster',
                              style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                            ),
                          ],
                        ),
                      ),
                    ),

                  const SizedBox(height: 20),

                  // --- Location Card ---
                  const Text('Location', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF1E293B))),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.location_on_rounded, color: Color(0xFF10B981), size: 22),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _isFetchingLocation
                                    ? 'Detecting precise address...'
                                    : (_currentAddress ?? 'Tap refresh to get GPS address'),
                                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Color(0xFF0F172A)),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _currentPosition != null
                                    ? 'GPS: ${_currentPosition!.latitude.toStringAsFixed(5)}, ${_currentPosition!.longitude.toStringAsFixed(5)}'
                                    : 'Awaiting location signal',
                                style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: _isFetchingLocation ? null : _getLocation,
                          icon: _isFetchingLocation
                              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: primaryColor))
                              : const Icon(Icons.refresh_rounded, color: Color(0xFF64748B), size: 20),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // --- Description with Voice-to-Text ---
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Description (Optional)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF1E293B))),
                      if (_isListening)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.red.shade50,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.red.shade200),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(width: 6, height: 6, decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle)),
                              const SizedBox(width: 4),
                              const Text('Listening...', style: TextStyle(fontSize: 11, color: Colors.red, fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: _isListening ? primaryColor : const Color(0xFFE2E8F0)),
                    ),
                    child: Stack(
                      children: [
                        TextField(
                          controller: _descriptionController,
                          maxLines: 4,
                          style: const TextStyle(fontSize: 14, color: Color(0xFF0F172A)),
                          decoration: const InputDecoration(
                            hintText: 'Describe details, landmarks, or how long this issue has persisted...',
                            hintStyle: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.fromLTRB(16, 14, 52, 14),
                          ),
                        ),
                        Positioned(
                          right: 8,
                          bottom: 8,
                          child: InkWell(
                            onTap: _listen,
                            borderRadius: BorderRadius.circular(20),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: _isListening ? Colors.red : primaryColor.withValues(alpha: 0.15),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                _isListening ? Icons.mic_rounded : Icons.mic_none_rounded,
                                color: _isListening ? Colors.white : primaryColor,
                                size: 20,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 28),

                  // --- Submit Button ---
                  ElevatedButton(
                    onPressed: _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryColor,
                      foregroundColor: const Color(0xFF1E293B),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.send_rounded, size: 20, color: Color(0xFF0F172A)),
                        SizedBox(width: 8),
                        Text(
                          'Submit Civic Report',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 30),
                ],
              ),
            ),
    );
  }

  Widget _buildSeverityOption({
    required String id,
    required String label,
    required String subtitle,
    required Color color,
  }) {
    final isSelected = _severity == id;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _severity = id),
        borderRadius: BorderRadius.circular(12),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
          decoration: BoxDecoration(
            color: isSelected ? color.withValues(alpha: 0.12) : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? color : const Color(0xFFE2E8F0),
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(color: color, shape: BoxShape.circle),
              ),
              const SizedBox(height: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: isSelected ? color : const Color(0xFF334155),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(fontSize: 9, color: Color(0xFF94A3B8)),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showPhotoPickerBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Add Issue Photo', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
              const SizedBox(height: 16),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: const Color(0xFFF59E0B).withValues(alpha: 0.12), shape: BoxShape.circle),
                  child: const Icon(Icons.camera_alt_rounded, color: Color(0xFFF59E0B)),
                ),
                title: const Text('Take Photo (Camera)', style: TextStyle(fontWeight: FontWeight.w600)),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: const Color(0xFF3B82F6).withValues(alpha: 0.12), shape: BoxShape.circle),
                  child: const Icon(Icons.photo_library_rounded, color: Color(0xFF3B82F6)),
                ),
                title: const Text('Choose from Gallery', style: TextStyle(fontWeight: FontWeight.w600)),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImage(ImageSource.gallery);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
