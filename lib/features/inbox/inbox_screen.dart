import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:civic_app/features/inbox/inbox_provider.dart';
import 'package:civic_app/features/inbox/evidence_upload_modal.dart';

class InboxScreen extends ConsumerStatefulWidget {
  const InboxScreen({super.key});

  @override
  ConsumerState<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends ConsumerState<InboxScreen> {
  String _filter = 'all'; // 'all', 'action_required', 'updates'

  String _formatTimeAgo(DateTime? dt) {
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt.toLocal());
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.day}/${dt.month}/${dt.year}';
  }

  Color _getTypeColor(String type) {
    switch (type.toLowerCase()) {
      case 'evidence_request':        // web portal sends 'evidence_request'
        return const Color(0xFFEF4444);
      case 'resolved':
        return const Color(0xFF10B981);
      case 'repaired':
        return const Color(0xFF059669);
      case 'in_progress':
        return const Color(0xFFF59E0B);
      case 'assigned':
        return const Color(0xFF8B5CF6);
      case 'rejected':
        return const Color(0xFF64748B);
      default:
        return const Color(0xFF3B82F6);
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type.toLowerCase()) {
      case 'evidence_request':
        return Icons.add_photo_alternate_rounded;
      case 'resolved':
        return Icons.verified_rounded;
      case 'repaired':
        return Icons.check_circle_rounded;
      case 'in_progress':
        return Icons.construction_rounded;
      case 'assigned':
        return Icons.assignment_ind_rounded;
      case 'rejected':
        return Icons.cancel_rounded;
      default:
        return Icons.notifications_active_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFFF59E0B);
    final notificationsAsync = ref.watch(notificationsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        title: const Text(
          'Citizen Inbox',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: Color(0xFF0F172A)),
        ),
        actions: [
          IconButton(
            tooltip: 'Refresh Notifications',
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF64748B)),
            onPressed: () => ref.read(notificationsProvider.notifier).fetchNotifications(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('all', 'All Messages'),
                  const SizedBox(width: 8),
                  _buildFilterChip('action_required', '⚠️ Action Required'),
                  const SizedBox(width: 8),
                  _buildFilterChip('updates', 'Status Updates'),
                ],
              ),
            ),
          ),

          const Divider(height: 1, color: Color(0xFFE2E8F0)),

          // Notifications List
          Expanded(
            child: notificationsAsync.when(
              data: (items) {
                final filtered = items.where((item) {
                  if (_filter == 'action_required') {
                    return item.actionRequired;
                  }
                  if (_filter == 'updates') {
                    return !item.actionRequired;
                  }
                  return true;
                }).toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          _filter == 'action_required' ? Icons.task_alt_rounded : Icons.mark_email_read_outlined,
                          size: 56,
                          color: const Color(0xFFCBD5E1),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          _filter == 'action_required' ? 'No pending action requests' : 'Your inbox is clear',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF475569)),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _filter == 'action_required'
                              ? 'When authorities request more photo evidence, it will show here.'
                              : 'Municipal updates and ticket alerts will arrive in real time.',
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.read(notificationsProvider.notifier).fetchNotifications(),
                  color: primaryColor,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final item = filtered[index];
                      final color = _getTypeColor(item.type);
                      final icon = _getTypeIcon(item.type);
                      final timeAgo = _formatTimeAgo(item.createdAt);
                      final isActionPending = item.actionRequired && !item.actionCompleted;

                      return InkWell(
                        onTap: () {
                          if (!item.isRead) {
                            ref.read(notificationsProvider.notifier).markAsRead(item.id);
                          }
                          if (isActionPending) {
                            EvidenceUploadModal.show(context, item);
                          }
                        },
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: item.isRead ? Colors.white : const Color(0xFFF0F9FF),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isActionPending
                                  ? const Color(0xFFFCA5A5)
                                  : (item.isRead ? const Color(0xFFE2E8F0) : const Color(0xFFBAE6FD)),
                              width: isActionPending ? 1.5 : 1,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.02),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Icon Badge
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: color.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Icon(icon, color: color, size: 22),
                                  ),
                                  const SizedBox(width: 12),

                                  // Content
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Expanded(
                                              child: Text(
                                                item.title,
                                                style: TextStyle(
                                                  fontWeight: item.isRead ? FontWeight.bold : FontWeight.w800,
                                                  fontSize: 14,
                                                  color: const Color(0xFF0F172A),
                                                ),
                                              ),
                                            ),
                                            if (!item.isRead)
                                              Container(
                                                width: 8,
                                                height: 8,
                                                decoration: const BoxDecoration(
                                                  color: Color(0xFF0284C7),
                                                  shape: BoxShape.circle,
                                                ),
                                              ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          item.message,
                                          style: const TextStyle(fontSize: 12, color: Color(0xFF475569), height: 1.4),
                                        ),
                                        const SizedBox(height: 8),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(
                                              timeAgo,
                                              style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                                            ),
                                            if (item.actionCompleted)
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFF10B981).withValues(alpha: 0.1),
                                                  borderRadius: BorderRadius.circular(6),
                                                ),
                                                child: const Row(
                                                  mainAxisSize: MainAxisSize.min,
                                                  children: [
                                                    Icon(Icons.check, size: 12, color: Color(0xFF10B981)),
                                                    SizedBox(width: 3),
                                                    Text(
                                                      'Evidence Submitted',
                                                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),

                              // If Action is Required & Pending, show prominent upload button
                              if (isActionPending) ...[
                                const SizedBox(height: 12),
                                const Divider(height: 1, color: Color(0xFFFEE2E2)),
                                const SizedBox(height: 10),
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton.icon(
                                    onPressed: () => EvidenceUploadModal.show(context, item),
                                    icon: const Icon(Icons.camera_alt_rounded, size: 16, color: Colors.white),
                                    label: const Text(
                                      'Capture & Upload Requested Photo',
                                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.white),
                                    ),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFFEF4444),
                                      padding: const EdgeInsets.symmetric(vertical: 10),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                      elevation: 0,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator(color: primaryColor)),
              error: (e, _) => Center(child: Text('Error: $e')),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String id, String label) {
    final isSelected = _filter == id;
    return InkWell(
      onTap: () => setState(() => _filter = id),
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.white : const Color(0xFF64748B),
          ),
        ),
      ),
    );
  }
}
