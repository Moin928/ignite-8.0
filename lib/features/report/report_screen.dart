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
  File? _image;
  String _category = 'other'; // matches DB enum default
  final _descriptionController = TextEditingController();
  
  Position? _currentPosition;
  String? _currentAddress;
  
  bool _isLoading = false;
  
  final _speech = stt.SpeechToText();
  bool _isListening = false;

  // Keys are the exact enum values in the DB, values are display labels
  final Map<String, String> _categories = {
    'pothole': 'Pothole',
    'garbage': 'Garbage Overflow',
    'broken_streetlight': 'Broken Streetlight',
    'water_leakage': 'Water Leakage',
    'road_damage': 'Road Damage',
    'other': 'Other',
  };

  @override
  void initState() {
    super.initState();
    _getLocation();
  }

  Future<void> _getLocation() async {
    var status = await Permission.location.request();
    if (status.isGranted) {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high
      );
      setState(() => _currentPosition = position);
      
      try {
        final placemarks = await placemarkFromCoordinates(position.latitude, position.longitude);
        if (placemarks.isNotEmpty) {
          final place = placemarks.first;
          setState(() {
            _currentAddress = '${place.street}, ${place.locality}, ${place.administrativeArea}';
          });
        }
      } catch (e) {
        // Geocoding failed
      }
    }
  }

  Future<void> _pickImage() async {
    var status = await Permission.camera.request();
    if (status.isGranted) {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(source: ImageSource.camera);
      if (pickedFile != null) {
        setState(() {
          _image = File(pickedFile.path);
        });
      }
    }
  }

  Future<void> _listen() async {
    if (!_isListening) {
      var status = await Permission.microphone.request();
      if (status.isGranted) {
        bool available = await _speech.initialize();
        if (available) {
          setState(() => _isListening = true);
          _speech.listen(
            onResult: (val) => setState(() {
              _descriptionController.text = val.recognizedWords;
            }),
          );
        }
      }
    } else {
      setState(() => _isListening = false);
      _speech.stop();
    }
  }

  Future<void> _submit() async {
    if (_image == null || _currentPosition == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please provide an image and ensure location is found.')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      await ref.read(reportProvider).submitReport(
        category: _category,
        description: _descriptionController.text,
        imageFile: _image!,
        lat: _currentPosition!.latitude,
        lng: _currentPosition!.longitude,
      );
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Report submitted successfully!')),
        );
        setState(() {
          _image = null;
          _descriptionController.clear();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
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
    return Scaffold(
      appBar: AppBar(title: const Text('Report an Issue')),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                DropdownButtonFormField<String>(
                  initialValue: _category,
                  decoration: const InputDecoration(labelText: 'Issue Category'),
                  items: _categories.entries.map((entry) {
                    return DropdownMenuItem(
                      value: entry.key,       // DB enum value e.g. 'pothole'
                      child: Text(entry.value), // Display label e.g. 'Pothole'
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _category = val);
                  },
                ),
                const SizedBox(height: 16),
                
                GestureDetector(
                  onTap: _pickImage,
                  child: Container(
                    height: 200,
                    color: Colors.grey[200],
                    child: _image != null
                      ? Image.file(_image!, fit: BoxFit.cover)
                      : const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.camera_alt, size: 48),
                            Text('Tap to take a photo'),
                          ],
                        ),
                  ),
                ),
                const SizedBox(height: 16),
                
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.location_on),
                  title: Text(_currentAddress ?? 'Fetching location...'),
                  subtitle: _currentPosition != null 
                    ? Text('${_currentPosition!.latitude}, ${_currentPosition!.longitude}')
                    : null,
                ),
                const SizedBox(height: 16),
                
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _descriptionController,
                        decoration: const InputDecoration(
                          labelText: 'Description (Optional)',
                          border: OutlineInputBorder(),
                        ),
                        maxLines: 3,
                      ),
                    ),
                    IconButton(
                      icon: Icon(_isListening ? Icons.mic : Icons.mic_none),
                      color: _isListening ? Colors.red : null,
                      onPressed: _listen,
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                
                ElevatedButton(
                  onPressed: _submit,
                  child: const Text('Submit Report'),
                ),
              ],
            ),
          ),
    );
  }
}
