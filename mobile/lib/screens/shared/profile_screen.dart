import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/api/educheck_api.dart';
import '../../core/notifications/notification_poller.dart';
import '../../core/session/session_store.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/ui.dart';
import '../auth/login_screen.dart';
import 'school_year.dart';

const Map<String, String> roleLabels = {
  'admin': 'School Administrator',
  'principal': 'Principal',
  'adviser': 'Class Adviser',
  'subject': 'Subject Teacher',
};

/// Account tab shared by every role: account details from /api/auth/me,
/// assignments, change password, phone-alert toggle, and log out.
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  Future<void> _logout(BuildContext context) async {
    NotificationPoller.instance.stop();
    SchoolYearContext.reset();
    await EduCheckApi.instance.logout();
    if (!context.mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final role = SessionStore.instance.role;

    return AsyncView<Json>(
      load: () async {
        final me = await EduCheckApi.instance.me();
        List<Json> assignments = [];
        if (role == 'adviser' || role == 'subject') {
          assignments = (await EduCheckApi.instance.myAssignments()).data;
        }
        return ApiResult<Json>(
          {'user': me.data, 'assignments': assignments},
          fromCache: me.fromCache,
          cachedAt: me.cachedAt,
        );
      },
      builder: (context, data, reload) {
        final user = asMap(data['user']);
        final profile = user['profile'] == null ? null : asMap(user['profile']);
        final displayName = (user['full_name'] ?? user['username'] ?? '').toString();
        final assignments = asList(data['assignments']);

        return [
          AppCard(
            child: Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: AppTheme.lightBlue,
                  child: Text(
                    displayName.isEmpty ? '?' : displayName.characters.first.toUpperCase(),
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.primaryBlue),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        displayName,
                        style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        roleLabels[user['role']] ?? '',
                        style: const TextStyle(fontSize: 12.5, color: AppTheme.primaryBlue, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SectionTitle('Account'),
          AppCard(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: Column(
              children: [
                if (profile != null) ...[
                  _InfoRow(
                    icon: Icons.badge_outlined,
                    label: 'Employee No.',
                    value: profile['employee_number']?.toString() ?? '-',
                  ),
                  _InfoRow(
                    icon: Icons.phone_outlined,
                    label: 'Contact',
                    value: profile['contact_number']?.toString() ?? 'Not provided',
                  ),
                ],
                _InfoRow(icon: Icons.person_outline_rounded, label: 'Username', value: user['username']?.toString() ?? '-'),
                _InfoRow(icon: Icons.mail_outline_rounded, label: 'Email', value: user['email']?.toString() ?? '-'),
                _InfoRow(icon: Icons.verified_user_outlined, label: 'Status', value: user['status']?.toString() ?? '-'),
                _InfoRow(icon: Icons.event_outlined, label: 'Member since', value: formatDate(user['created_at'])),
                const Padding(
                  padding: EdgeInsets.only(top: 4, bottom: 8),
                  child: Text(
                    'To correct these details, ask the School Administrator.',
                    style: TextStyle(fontSize: 11.5, color: AppTheme.textGray),
                  ),
                ),
              ],
            ),
          ),
          if (role == 'adviser' || role == 'subject') ...[
            const SectionTitle('My assignments'),
            if (assignments.isEmpty)
              const EmptyState(
                icon: Icons.assignment_ind_outlined,
                message: 'No section or subject assigned yet. The Administrator sets this up on the web app.',
              ),
            for (final assignment in assignments) ...[
              AppCard(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    IconTile(
                      icon: assignment['subject_id'] == null ? Icons.groups_rounded : Icons.menu_book_rounded,
                      color: AppTheme.primaryBlue,
                      background: AppTheme.lightBlue,
                      size: 38,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Grade ${assignment['grade_level']} - ${assignment['section_name']}',
                            style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            assignment['subject_id'] == null
                                ? 'Class Adviser • ${assignment['staffing_mode']}'
                                : assignment['subject_name']?.toString() ?? '',
                            style: const TextStyle(fontSize: 11.5, color: AppTheme.textGray),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
            ],
          ],
          const SectionTitle('Settings'),
          AppCard(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Column(
              children: [
                const _AlertsToggle(),
                const Divider(height: 1, color: AppTheme.border, indent: 16, endIndent: 16),
                ListTile(
                  leading: const Icon(Icons.lock_outline_rounded, color: AppTheme.textDark),
                  title: const Text('Change password', style: TextStyle(fontSize: 14)),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () => showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    builder: (_) => const _ChangePasswordSheet(),
                  ),
                ),
                const Divider(height: 1, color: AppTheme.border, indent: 16, endIndent: 16),
                ListTile(
                  leading: const Icon(Icons.dns_outlined, color: AppTheme.textDark),
                  title: const Text('Server', style: TextStyle(fontSize: 14)),
                  subtitle: Text(SessionStore.instance.baseUrl, style: const TextStyle(fontSize: 12)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          OutlinedButton.icon(
            onPressed: () => _logout(context),
            icon: const Icon(Icons.logout_rounded, size: 18),
            label: const Text('Log out'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.danger,
              side: const BorderSide(color: Color(0xFFFECACA)),
              minimumSize: const Size.fromHeight(48),
            ),
          ),
          const SizedBox(height: 14),
          const Text(
            'EduCheck mobile is a companion to the web platform: uploads, grade encoding and '
            'SF10 generation stay on the web app.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 11, color: AppTheme.textGray, height: 1.4),
          ),
        ];
      },
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Icon(icon, size: 19, color: AppTheme.textGray),
          const SizedBox(width: 12),
          Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.textGray)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textDark),
            ),
          ),
        ],
      ),
    );
  }
}

class _AlertsToggle extends StatefulWidget {
  const _AlertsToggle();

  @override
  State<_AlertsToggle> createState() => _AlertsToggleState();
}

class _AlertsToggleState extends State<_AlertsToggle> {
  bool? _enabled;

  @override
  void initState() {
    super.initState();
    NotificationPoller.instance.alertsEnabled().then((value) {
      if (mounted) setState(() => _enabled = value);
    });
  }

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      secondary: const Icon(Icons.notifications_active_outlined, color: AppTheme.textDark),
      title: const Text('Phone alerts', style: TextStyle(fontSize: 14)),
      subtitle: const Text('Notify me about new updates while the app is open', style: TextStyle(fontSize: 12)),
      value: _enabled ?? true,
      onChanged: _enabled == null
          ? null
          : (value) async {
              await NotificationPoller.instance.setAlertsEnabled(value);
              setState(() => _enabled = value);
            },
    );
  }
}

class _ChangePasswordSheet extends StatefulWidget {
  const _ChangePasswordSheet();

  @override
  State<_ChangePasswordSheet> createState() => _ChangePasswordSheetState();
}

class _ChangePasswordSheetState extends State<_ChangePasswordSheet> {
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();
  bool _saving = false;
  String? _error;

  // Same rule as the backend (authController PASSWORD_RULE).
  static final RegExp _rule = RegExp(r'^(?=.*[A-Za-z])(?=.*\d).{8,}$');

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_rule.hasMatch(_next.text)) {
      setState(() => _error = 'Use at least 8 characters with a letter and a number.');
      return;
    }
    if (_next.text != _confirm.text) {
      setState(() => _error = 'The new passwords do not match.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await EduCheckApi.instance.changePassword(_current.text, _next.text);
      if (!mounted) return;
      Navigator.pop(context);
      showMessage(context, 'Password updated.');
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  InputDecoration _decoration(String label) => InputDecoration(
        labelText: label,
        fillColor: const Color(0xFFF8FAFC),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.border),
        ),
      );

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + MediaQuery.of(context).viewInsets.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Change password', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          TextField(controller: _current, obscureText: true, decoration: _decoration('Current password')),
          const SizedBox(height: 12),
          TextField(controller: _next, obscureText: true, decoration: _decoration('New password')),
          const SizedBox(height: 12),
          TextField(controller: _confirm, obscureText: true, decoration: _decoration('Confirm new password')),
          if (_error != null) ...[
            const SizedBox(height: 10),
            Text(_error!, style: const TextStyle(color: AppTheme.danger, fontSize: 12.5)),
          ],
          const SizedBox(height: 18),
          FilledButton(
            onPressed: _saving ? null : _save,
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
            child: _saving
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.2))
                : const Text('Update password'),
          ),
        ],
      ),
    );
  }
}
