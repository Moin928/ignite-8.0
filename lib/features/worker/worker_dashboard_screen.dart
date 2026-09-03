import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:civic_app/features/auth/auth_provider.dart';
import 'package:civic_app/features/worker/worker_provider.dart';
import 'package:civic_app/features/worker/worker_profile_screen.dart';
import 'package:civic_app/features/worker/repair_submit_modal.dart';
import 'package:civic_app/core/image_viewer.dart';
import 'package:civic_app/models/issue.dart';

class WorkerDashboardScreen extends ConsumerStatefulWidget {
  const WorkerDashboardScreen({super.key});

  @override
  ConsumerState<WorkerDashboardScreen> createState() => _WorkerDashboardScreenState();
}

class _WorkerDashboardScreenState extends ConsumerState<WorkerDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Position? _workerPosition;
  int _navIndex = 0; // 0 = Work Orders, 1 = Department & Profile

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _getWorkerLocation();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _getWorkerLocation() async {
    try {
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium),
      );
      if (mounted) {
        setState(() => _workerPosition = pos);
      }
    } catch (_) {}
  }

  String _formatDistance(Issue issue) {
    if (_workerPosition == null || issue.lat == null || issue.lng == null) return '';
    final meters = Geolocator.distanceBetween(
      _workerPosition!.latitude,
      _workerPosition!.longitude,
      issue.lat!,
      issue.lng!,
    );
    if (meters < 1000) return '${meters.round()} m away';
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

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFFF59E0B);
    final workerIssuesAsync = ref.watch(workerIssuesProvider);
    final user = ref.watch(authProvider).value;
    final workerName = (user?.userMetadata?['full_name'] as String?) ?? user?.email?.split('@').first ?? 'Field Worker';
    final department = (user?.userMetadata?['department'] as String?) ?? 'Municipal Worker';

    if (_navIndex == 1) {
      return Scaffold(
        body: const WorkerProfileScreen(),
        bottomNavigationBar: _buildBottomNav(primaryColor),
      );
    }

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
                color: const Color(0xFF3B82F6).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.engineering_rounded, color: Color(0xFF2563EB), size: 22),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    workerName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF0F172A)),
                  ),
                  Text(
                    department,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, color: Color(0xFF2563EB), fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Department & Profile',
            icon: const Icon(Icons.account_circle_outlined, color: Color(0xFF334155), size: 26),
            onPressed: () => setState(() => _navIndex = 1),
          ),
          IconButton(
            tooltip: 'Logout',
            icon: const Icon(Icons.logout_rounded, color: Color(0xFFEF4444)),
            onPressed: () async {
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFF0F172A),
          unselectedLabelColor: const Color(0xFF94A3B8),
          indicatorColor: primaryColor,
          indicatorWeight: 3,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: const [
            Tab(text: 'Assigned'),
            Tab(text: 'In Progress'),
            Tab(text: 'Repaired'),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomNav(primaryColor),
      body: workerIssuesAsync.when(
        data: (issues) {
          final assignedIssues = issues.where((i) => i.status.toLowerCase() == 'assigned').toList();
          final inProgressIssues = issues.where((i) => i.status.toLowerCase().replaceAll(' ', '_') == 'in_progress').toList();
          final repairedIssues = issues.where((i) {
            final st = i.status.toLowerCase().replaceAll(' ', '_');
            return st == 'repaired' || st == 'resolved';
          }).toList();

          return TabBarView(
            controller: _tabController,
            children: [
              _buildTaskList(assignedIssues, TaskStage.assigned),
              _buildTaskList(inProgressIssues, TaskStage.inProgress),
              _buildTaskList(repairedIssues, TaskStage.repaired),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: primaryColor)),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline_rounded, color: Colors.red, size: 40),
              const SizedBox(height: 12),
              Text('Failed to load tasks: $e', style: const TextStyle(color: Color(0xFF64748B))),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => ref.read(workerIssuesProvider.notifier).fetchWorkerIssues(),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottomNav(Color primaryColor) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
      ),
      child: BottomNavigationBar(
        currentIndex: _navIndex,
        onTap: (index) => setState(() => _navIndex = index),
        selectedItemColor: const Color(0xFF2563EB),
        unselectedItemColor: const Color(0xFF64748B),
        backgroundColor: Colors.white,
        elevation: 0,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment_outlined),
            activeIcon: Icon(Icons.assignment_rounded),
            label: 'Work Orders',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.badge_outlined),
            activeIcon: Icon(Icons.badge_rounded),
            label: 'My Department',
          ),
        ],
      ),
    );
  }

  Widget _buildTaskList(List<Issue> tasks, TaskStage stage) {
    if (tasks.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              stage == TaskStage.assigned
                  ? Icons.assignment_turned_in_outlined
                  : (stage == TaskStage.inProgress ? Icons.construction_outlined : Icons.check_circle_outline_rounded),
              size: 56,
              color: const Color(0xFFCBD5E1),
            ),
            const SizedBox(height: 12),
            Text(
              stage == TaskStage.assigned
                  ? 'No newly assigned tasks'
                  : (stage == TaskStage.inProgress ? 'No active repairs in progress' : 'No completed work records'),
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF475569)),
            ),
            const SizedBox(height: 4),
            const Text('Government work orders will appear here in real time.', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async => ref.read(workerIssuesProvider.notifier).fetchWorkerIssues(),
      color: const Color(0xFFF59E0B),
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: tasks.length,
        separatorBuilder: (_, _) => const SizedBox(height: 14),
        itemBuilder: (context, index) {
          final issue = tasks[index];
          final distance = _formatDistance(issue);
          final severityColor = _getSeverityColor(issue.severity);

          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 2)),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Category icon + Title + Severity
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (issue.imageUrl != null && issue.imageUrl!.isNotEmpty)
                      GestureDetector(
                        onTap: () => FullScreenImageViewer.open(context, issue.imageUrl!, title: 'Citizen Report Photo'),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: CachedNetworkImage(
                            imageUrl: issue.imageUrl!,
                            width: 64,
                            height: 64,
                            fit: BoxFit.cover,
                            placeholder: (_, _) => Container(width: 64, height: 64, color: const Color(0xFFF1F5F9)),
                            errorWidget: (_, _, _) => Container(
                              width: 64,
                              height: 64,
                              color: const Color(0xFFF1F5F9),
                              child: Icon(_getCategoryIcon(issue.category), color: const Color(0xFF64748B)),
                            ),
                          ),
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
                        child: Icon(_getCategoryIcon(issue.category), color: const Color(0xFF475569)),
                      ),

                    const SizedBox(width: 12),

                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            issue.title,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF0F172A)),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            issue.category.replaceAll('_', ' ').toUpperCase(),
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8), letterSpacing: 0.5),
                          ),
                          if (distance.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.near_me_rounded, size: 12, color: Color(0xFF0F172A)),
                                const SizedBox(width: 4),
                                Text(distance, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),

                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: severityColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        issue.severity.toUpperCase(),
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: severityColor),
                      ),
                    ),
                  ],
                ),

                if (issue.description != null && issue.description!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      issue.description!,
                      style: const TextStyle(fontSize: 12, color: Color(0xFF475569)),
                    ),
                  ),
                ],

                // If Repaired, show After Photo & Notes
                if (stage == TaskStage.repaired && issue.repair != null) ...[
                  const SizedBox(height: 12),
                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      if (issue.repair!.afterImageUrl.isNotEmpty)
                        GestureDetector(
                          onTap: () => FullScreenImageViewer.open(context, issue.repair!.afterImageUrl, title: 'Completed Repair Proof'),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: CachedNetworkImage(
                              imageUrl: issue.repair!.afterImageUrl,
                              width: 50,
                              height: 50,
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 14),
                                SizedBox(width: 4),
                                Text('Repair Proof Logged', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                              ],
                            ),
                            if (issue.repair!.notes != null && issue.repair!.notes!.isNotEmpty)
                              Text(
                                issue.repair!.notes!,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],

                const SizedBox(height: 14),
                const Divider(height: 1, color: Color(0xFFF1F5F9)),
                const SizedBox(height: 12),

                // Action Buttons according to Stage
                if (stage == TaskStage.assigned)
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        await ref.read(workerIssuesProvider.notifier).startWork(issue.id);
                        if (mounted) {
                          ScaffoldMessenger.of(this.context).showSnackBar(
                            const SnackBar(
                              content: Text('Task accepted! Work status changed to In Progress.'),
                              backgroundColor: Color(0xFFF59E0B),
                            ),
                          );
                          _tabController.animateTo(1);
                        }
                      },
                      icon: const Icon(Icons.play_arrow_rounded, size: 18, color: Color(0xFF0F172A)),
                      label: const Text('Start Repair Work', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFF59E0B),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        elevation: 0,
                      ),
                    ),
                  )
                else if (stage == TaskStage.inProgress)
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => RepairSubmitModal.show(context, issue),
                      icon: const Icon(Icons.camera_alt_rounded, size: 18, color: Colors.white),
                      label: const Text('Complete Work & Upload After Photo', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        elevation: 0,
                      ),
                    ),
                  )
                else
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      '✓ Repaired & Verification Complete',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

enum TaskStage { assigned, inProgress, repaired }
