import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:civic_app/core/supabase_provider.dart';
import 'package:civic_app/features/auth/auth_provider.dart';
import 'package:civic_app/features/worker/worker_provider.dart';
import 'package:civic_app/models/profile.dart';

class WorkerProfileScreen extends ConsumerStatefulWidget {
  const WorkerProfileScreen({super.key});

  @override
  ConsumerState<WorkerProfileScreen> createState() => _WorkerProfileScreenState();
}

class _WorkerProfileScreenState extends ConsumerState<WorkerProfileScreen> {
  String _selectedDepartment = 'Road & Pothole Repair';
  final _phoneController = TextEditingController();
  final _wardController = TextEditingController();
  final _nameController = TextEditingController();
  bool _isLoading = false;
  bool _isSaving = false;

  final List<Map<String, dynamic>> _departments = [
    {
      'title': 'Road & Pothole Repair',
      'subtitle': 'Potholes, asphalt subsidence, broken medians & road surfaces',
      'icon': Icons.remove_road_rounded,
      'color': Color(0xFFF59E0B),
    },
    {
      'title': 'Water Supply & Drainage',
      'subtitle': 'Pipeline bursts, sewage leaks, manholes & drainage overflows',
      'icon': Icons.water_drop_rounded,
      'color': Color(0xFF0284C7),
    },
    {
      'title': 'Solid Waste Management',
      'subtitle': 'Garbage accumulation, overflowing bins & street cleanliness',
      'icon': Icons.delete_sweep_rounded,
      'color': Color(0xFF10B981),
    },
    {
      'title': 'Electricity & Streetlamps',
      'subtitle': 'Inoperative streetlights, tilted poles & exposed electrical wires',
      'icon': Icons.lightbulb_rounded,
      'color': Color(0xFF8B5CF6),
    },
    {
      'title': 'Civil Infrastructure Unit',
      'subtitle': 'Damaged footpaths, bridges, school zones & public hazards',
      'icon': Icons.architecture_rounded,
      'color': Color(0xFFEA580C),
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _wardController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    final user = ref.read(authProvider).value;
    if (user == null) return;

    setState(() => _isLoading = true);

    try {
      final supabase = ref.read(supabaseProvider);
      final res = await supabase.from('profiles').select().eq('id', user.id).maybeSingle();

      if (res != null) {
        final profile = Profile.fromJson(res);
        setState(() {
          _selectedDepartment = profile.department ?? (user.userMetadata?['department'] as String?) ?? 'Road & Pothole Repair';
          _phoneController.text = profile.phone ?? '';
          _wardController.text = profile.wardZone ?? 'Ward 1 - Central';
          _nameController.text = profile.fullName ?? (user.userMetadata?['full_name'] as String?) ?? '';
        });
      } else {
        setState(() {
          _nameController.text = (user.userMetadata?['full_name'] as String?) ?? '';
          _selectedDepartment = (user.userMetadata?['department'] as String?) ?? 'Road & Pothole Repair';
          _wardController.text = 'Ward 1 - Central';
        });
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _saveProfile() async {
    final user = ref.read(authProvider).value;
    if (user == null) return;

    setState(() => _isSaving = true);

    try {
      final supabase = ref.read(supabaseProvider);
      final fullName = _nameController.text.trim().isNotEmpty
          ? _nameController.text.trim()
          : (user.userMetadata?['full_name'] as String?) ?? 'Field Worker';

      // 1. Update profiles table
      await supabase.from('profiles').upsert({
        'id': user.id,
        'full_name': fullName,
        'role': 'worker',
        'department': _selectedDepartment,
        'phone': _phoneController.text.trim(),
        'ward_zone': _wardController.text.trim(),
      });

      // 2. Update auth user metadata
      try {
        await supabase.auth.updateUser(
          UserAttributes(
            data: {
              'full_name': fullName,
              'role': 'worker',
              'department': _selectedDepartment,
              'phone': _phoneController.text.trim(),
              'ward_zone': _wardController.text.trim(),
            },
          ),
        );
      } catch (_) {}

      // Refresh provider
      ref.invalidate(currentProfileProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                const SizedBox(width: 8),
                Expanded(child: Text('Department updated to "$_selectedDepartment" in Supabase!')),
              ],
            ),
            backgroundColor: const Color(0xFF10B981),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update department: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFFF59E0B);
    final user = ref.watch(authProvider).value;
    final workerIssues = ref.watch(workerIssuesProvider);
    final workerName = _nameController.text.isNotEmpty
        ? _nameController.text
        : (user?.userMetadata?['full_name'] as String?) ?? user?.email?.split('@').first ?? 'Field Worker';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        title: const Text(
          'Worker Profile & Department',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF0F172A)),
        ),
        actions: [
          IconButton(
            tooltip: 'Logout',
            icon: const Icon(Icons.logout_rounded, color: Color(0xFFEF4444)),
            onPressed: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Sign Out'),
                  content: const Text('Are you sure you want to log out of the Field Worker portal?'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                    TextButton(
                      onPressed: () => Navigator.pop(ctx, true),
                      style: TextButton.styleFrom(foregroundColor: Colors.red),
                      child: const Text('Logout'),
                    ),
                  ],
                ),
              );

              if (confirm == true) {
                await ref.read(authProvider.notifier).logout();
                if (context.mounted) context.go('/login');
              }
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: primaryColor))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Worker Header Card
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 2)),
                      ],
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 30,
                              backgroundColor: primaryColor.withValues(alpha: 0.2),
                              child: const Icon(Icons.engineering_rounded, color: Color(0xFFB45309), size: 32),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    workerName,
                                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    user?.email ?? 'worker@municipality.gov',
                                    style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                                  ),
                                  const SizedBox(height: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF2563EB).withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Text(
                                      'MUNICIPAL FIELD WORKER',
                                      style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF2563EB), letterSpacing: 0.5),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 16),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        const SizedBox(height: 14),

                        // Performance metrics
                        workerIssues.maybeWhen(
                          data: (issues) {
                            final assigned = issues.where((i) => i.status.toLowerCase() == 'assigned').length;
                            final inProgress = issues.where((i) => i.status.toLowerCase().replaceAll(' ', '_') == 'in_progress').length;
                            final completed = issues.where((i) {
                              final st = i.status.toLowerCase().replaceAll(' ', '_');
                              return st == 'repaired' || st == 'resolved';
                            }).length;

                            return Row(
                              children: [
                                _buildMetricBox('Assigned', '$assigned', const Color(0xFF3B82F6)),
                                const SizedBox(width: 10),
                                _buildMetricBox('In Progress', '$inProgress', const Color(0xFFF59E0B)),
                                const SizedBox(width: 10),
                                _buildMetricBox('Repaired', '$completed', const Color(0xFF10B981)),
                              ],
                            );
                          },
                          orElse: () => const SizedBox(),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Section: Municipal Department Selection
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(color: primaryColor.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8)),
                        child: const Icon(Icons.apartment_rounded, color: Color(0xFFD97706), size: 18),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'Assigned Department / Unit',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Government dispatchers will allocate complaints matching this specific municipal expertise.',
                    style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                  ),
                  const SizedBox(height: 14),

                  // Department selection cards
                  Column(
                    children: _departments.map((dept) {
                      final isSelected = _selectedDepartment == dept['title'];
                      final color = dept['color'] as Color;

                      return InkWell(
                        onTap: () => setState(() => _selectedDepartment = dept['title'] as String),
                        borderRadius: BorderRadius.circular(14),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: isSelected ? color.withValues(alpha: 0.08) : Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: isSelected ? color : const Color(0xFFE2E8F0),
                              width: isSelected ? 2 : 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: color.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(dept['icon'] as IconData, color: color, size: 22),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      dept['title'] as String,
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: isSelected ? color : const Color(0xFF1E293B),
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      dept['subtitle'] as String,
                                      style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                                    ),
                                  ],
                                ),
                              ),
                              Icon(
                                isSelected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                                color: isSelected ? color : const Color(0xFFCBD5E1),
                                size: 22,
                              ),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 18),

                  // Section: Contact & Ward Details
                  const Text(
                    'Operational Contact & Ward',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                  ),
                  const SizedBox(height: 10),

                  TextField(
                    controller: _nameController,
                    decoration: InputDecoration(
                      labelText: 'Full Name',
                      prefixIcon: const Icon(Icons.person_outline),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _phoneController,
                    decoration: InputDecoration(
                      labelText: 'Contact Phone Number',
                      prefixIcon: const Icon(Icons.phone_outlined),
                      hintText: '+91 98765 43210',
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    ),
                    keyboardType: TextInputType.phone,
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _wardController,
                    decoration: InputDecoration(
                      labelText: 'Assigned Ward / Municipal Zone',
                      prefixIcon: const Icon(Icons.location_city_outlined),
                      hintText: 'e.g., Ward 4 - West Zone',
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Save Button
                  ElevatedButton(
                    onPressed: _isSaving ? null : _saveProfile,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryColor,
                      foregroundColor: const Color(0xFF0F172A),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                    child: _isSaving
                        ? const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF0F172A))),
                              SizedBox(width: 10),
                              Text('Saving Department in Supabase...', style: TextStyle(fontWeight: FontWeight.bold)),
                            ],
                          )
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.save_rounded, size: 20),
                              SizedBox(width: 8),
                              Text('Save Department & Profile', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                            ],
                          ),
                  ),

                  const SizedBox(height: 30),
                ],
              ),
            ),
    );
  }

  Widget _buildMetricBox(String label, String count, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(count, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF64748B)), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
