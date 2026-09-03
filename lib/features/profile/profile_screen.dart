import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:civic_app/features/auth/auth_provider.dart';
import 'package:civic_app/features/profile/profile_provider.dart';
import 'package:civic_app/core/image_viewer.dart';
import 'package:civic_app/models/report.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

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

  String _formatDate(DateTime? dt) {
    if (dt == null) return '';
    final local = dt.toLocal();
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    final hour = local.hour.toString().padLeft(2, '0');
    final minute = local.minute.toString().padLeft(2, '0');
    return '${months[local.month - 1]} ${local.day}, ${local.year} • $hour:$minute';
  }

  String _formatTimeAgo(DateTime? dt) {
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt.toLocal());
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return _formatDate(dt);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    const primaryColor = Color(0xFFF59E0B);
    final myReportsAsync = ref.watch(myReportsProvider);
    final user = ref.read(authProvider).value;
    final userName = (user?.userMetadata?['full_name'] as String?) ?? user?.email?.split('@').first ?? 'Citizen';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        title: const Text(
          'Citizen Profile',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: Color(0xFF0F172A)),
        ),
        actions: [
          IconButton(
            tooltip: 'Logout',
            icon: const Icon(Icons.logout_rounded, color: Color(0xFFEF4444)),
            onPressed: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Logout'),
                  content: const Text('Are you sure you want to sign out?'),
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
      body: RefreshIndicator(
        onRefresh: () async => ref.read(myReportsProvider.notifier).fetchReports(),
        color: primaryColor,
        child: CustomScrollView(
          slivers: [
            // User Profile Card
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.all(16),
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
                          radius: 28,
                          backgroundColor: primaryColor.withValues(alpha: 0.2),
                          child: Text(
                            userName.isNotEmpty ? userName[0].toUpperCase() : 'C',
                            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFFB45309)),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                userName,
                                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                user?.email ?? 'No email',
                                style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.verified_user_rounded, color: Color(0xFF10B981), size: 14),
                              SizedBox(width: 4),
                              Text('Citizen', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),
                    const Divider(height: 1, color: Color(0xFFF1F5F9)),
                    const SizedBox(height: 14),

                    // Quick Stats Bar
                    myReportsAsync.when(
                      data: (reports) {
                        final total = reports.length;
                        final inProgress = reports.where((r) {
                          final st = r.issue?.status.toLowerCase().replaceAll(' ', '_');
                          return st == 'in_progress' || st == 'acknowledged';
                        }).length;
                        final resolved = reports.where((r) => r.issue?.status.toLowerCase() == 'resolved').length;

                        return Row(
                          children: [
                            _buildStatBox('Total Reports', '$total', const Color(0xFF3B82F6)),
                            const SizedBox(width: 10),
                            _buildStatBox('In Progress', '$inProgress', const Color(0xFFF59E0B)),
                            const SizedBox(width: 10),
                            _buildStatBox('Resolved', '$resolved', const Color(0xFF10B981)),
                          ],
                        );
                      },
                      loading: () => const SizedBox(height: 45, child: Center(child: CircularProgressIndicator(strokeWidth: 2))),
                      error: (_, _) => const SizedBox(),
                    ),
                  ],
                ),
              ),
            ),

            // Section Header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Text(
                          'My Reports',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                        ),
                        SizedBox(width: 8),
                        Icon(Icons.fiber_manual_record, size: 10, color: Color(0xFF10B981)),
                        SizedBox(width: 4),
                        Text('Live', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF10B981))),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.refresh_rounded, size: 20, color: Color(0xFF64748B)),
                      onPressed: () => ref.read(myReportsProvider.notifier).fetchReports(),
                    ),
                  ],
                ),
              ),
            ),

            // Reports List
            myReportsAsync.when(
              data: (reports) {
                if (reports.isEmpty) {
                  return const SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.inbox_rounded, size: 54, color: Color(0xFFCBD5E1)),
                          SizedBox(height: 12),
                          Text('No reports filed yet', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF475569))),
                          SizedBox(height: 4),
                          Text('Issues you report will appear here with live tracking.', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
                        ],
                      ),
                    ),
                  );
                }

                return SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  sliver: SliverList.separated(
                    itemCount: reports.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final report = reports[index];
                      final status = report.issue?.status ?? 'reported';
                      final statusColor = _getStatusColor(status);
                      final title = report.issue?.title ?? report.description ?? 'Civic Issue';
                      final dateStr = _formatDate(report.createdAt);
                      final updatedStr = report.issue?.updatedAt != null ? _formatTimeAgo(report.issue!.updatedAt) : null;

                      return InkWell(
                        onTap: () => _showReportDetailModal(context, report),
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 6, offset: const Offset(0, 2)),
                            ],
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Image Thumbnail with zoom trigger
                              if (report.imageUrl.isNotEmpty)
                                GestureDetector(
                                  onTap: () => FullScreenImageViewer.open(context, report.imageUrl, title: title),
                                  child: Stack(
                                    children: [
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(12),
                                        child: CachedNetworkImage(
                                          imageUrl: report.imageUrl,
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
                                            child: const Icon(Icons.broken_image_rounded, color: Color(0xFF94A3B8)),
                                          ),
                                        ),
                                      ),
                                      Positioned(
                                        bottom: 3,
                                        right: 3,
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
                                  width: 76,
                                  height: 76,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(Icons.image_outlined, color: Color(0xFF94A3B8)),
                                ),

                              const SizedBox(width: 14),

                              // Info Column
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            title,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F172A)),
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        // Status Pill
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: statusColor.withValues(alpha: 0.12),
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                          child: Text(
                                            _formatStatusLabel(status),
                                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: statusColor),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      report.description != null && report.description!.isNotEmpty
                                          ? report.description!
                                          : 'No description provided',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          dateStr,
                                          style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                                        ),
                                        if (updatedStr != null)
                                          Text(
                                            'Updated $updatedStr',
                                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: statusColor),
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
              },
              loading: () => const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator(color: primaryColor)),
              ),
              error: (e, _) => SliverFillRemaining(
                child: Center(
                  child: Text('Error loading reports: $e', style: const TextStyle(color: Colors.red)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatBox(String label, String count, Color color) {
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

  void _showReportDetailModal(BuildContext context, Report report) {
    final issue = report.issue;
    final status = issue?.status ?? 'reported';
    final statusColor = _getStatusColor(status);
    final title = issue?.title ?? report.description ?? 'Civic Issue';
    final dateStr = _formatDate(report.createdAt);
    final updatedAtStr = _formatDate(issue?.updatedAt ?? report.createdAt);
    final timeAgo = _formatTimeAgo(issue?.updatedAt ?? report.createdAt);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.8,
        maxChildSize: 0.95,
        minChildSize: 0.5,
        expand: false,
        builder: (_, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 28),
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

              // Title and Header
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: const TextStyle(fontSize: 19, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Reported on $dateStr',
                          style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _formatStatusLabel(status),
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: statusColor),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 18),

              // Status Last Updated Card
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: statusColor.withValues(alpha: 0.2)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.schedule_rounded, size: 18, color: statusColor),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Status updated: $updatedAtStr ($timeAgo)',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: statusColor),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 18),

              // Image View (Clickable to view full screen zoomable modal)
              if (report.imageUrl.isNotEmpty) ...[
                GestureDetector(
                  onTap: () => FullScreenImageViewer.open(context, report.imageUrl, title: title),
                  child: Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: CachedNetworkImage(
                          imageUrl: report.imageUrl,
                          height: 210,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Container(
                            height: 210,
                            color: const Color(0xFFF1F5F9),
                            child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                          ),
                          errorWidget: (context, url, error) => Container(
                            height: 210,
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
                const SizedBox(height: 20),
              ],

              // Live Status Timeline Tracker (Handles Rejected, In Progress, Acknowledged, Resolved, Reported)
              const Text('Resolution Progress', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
              const SizedBox(height: 12),
              _buildTimeline(status, updatedAtStr),

              const SizedBox(height: 20),

              // Description Box
              const Text('Report Description', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
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
                  report.description != null && report.description!.isNotEmpty
                      ? report.description!
                      : 'No additional description provided.',
                  style: const TextStyle(fontSize: 13, color: Color(0xFF334155), height: 1.4),
                ),
              ),

              const SizedBox(height: 16),

              // Additional Details Grid
              if (issue != null) ...[
                Row(
                  children: [
                    Expanded(
                      child: _buildDetailCard('CATEGORY', issue.category.replaceAll('_', ' ').toUpperCase(), Icons.category_outlined),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildDetailCard('SEVERITY', issue.severity.toUpperCase(), Icons.warning_amber_rounded),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
              ],

              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailCard(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: const Color(0xFF64748B)),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeline(String currentStatus, String updatedAtStr) {
    final normalized = currentStatus.toLowerCase().replaceAll(' ', '_');

    if (normalized == 'rejected') {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFEF4444).withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.25)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.cancel_rounded, color: Color(0xFFEF4444), size: 22),
                SizedBox(width: 8),
                Text(
                  'Issue Rejected / Closed',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFFEF4444)),
                ),
              ],
            ),
            const SizedBox(height: 6),
            const Text(
              'This report was reviewed by municipal officers and marked as rejected (e.g. duplicate, private property, or non-actionable).',
              style: TextStyle(fontSize: 12, color: Color(0xFF475569), height: 1.4),
            ),
            const SizedBox(height: 8),
            Text(
              'Closed on $updatedAtStr',
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF94A3B8)),
            ),
          ],
        ),
      );
    }

    final stages = [
      {'key': 'reported', 'title': 'Reported', 'desc': 'Logged by citizen'},
      {'key': 'acknowledged', 'title': 'Acknowledged', 'desc': 'Reviewed by municipal department'},
      {'key': 'in_progress', 'title': 'In Progress', 'desc': 'Field workers dispatched to fix'},
      {'key': 'resolved', 'title': 'Resolved', 'desc': 'Repairs verified & closed'},
    ];

    final currentIndex = stages.indexWhere((s) => s['key'] == normalized);
    final activeIndex = currentIndex == -1 ? 0 : currentIndex;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: List.generate(stages.length, (index) {
          final stage = stages[index];
          final isCompleted = index <= activeIndex;
          final isCurrent = index == activeIndex;
          final isLast = index == stages.length - 1;

          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: [
                  Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      color: isCompleted
                          ? (isCurrent ? const Color(0xFFF59E0B) : const Color(0xFF10B981))
                          : const Color(0xFFE2E8F0),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      isCompleted ? Icons.check : Icons.circle,
                      size: 13,
                      color: isCompleted ? Colors.white : const Color(0xFF94A3B8),
                    ),
                  ),
                  if (!isLast)
                    Container(
                      width: 2,
                      height: 32,
                      color: index < activeIndex ? const Color(0xFF10B981) : const Color(0xFFE2E8F0),
                    ),
                ],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            stage['title']!,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: isCompleted ? FontWeight.bold : FontWeight.w500,
                              color: isCompleted ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
                            ),
                          ),
                          if (isCurrent) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text('CURRENT', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Color(0xFFD97706))),
                            ),
                          ],
                        ],
                      ),
                      Text(
                        stage['desc']!,
                        style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                      ),
                      if (!isLast) const SizedBox(height: 14),
                    ],
                  ),
                ),
              ),
            ],
          );
        }),
      ),
    );
  }
}
