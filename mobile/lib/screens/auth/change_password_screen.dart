import 'package:flutter/material.dart';

import '../../app.dart';
import '../../core/api/educheck_api.dart';
import '../../core/notifications/notification_poller.dart';
import '../../core/session/session_store.dart';
import '../../core/theme/app_theme.dart';
import 'login_screen.dart';

/// Shown after signing in with a temporary password (from account setup or
/// a reset by the Administrator). The server refuses every other request
/// until the user chooses their own password, so this screen has no way
/// back except signing out.
class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();
  bool _saving = false;
  bool _obscure = true;
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
    if (_current.text.isEmpty || _next.text.isEmpty || _confirm.text.isEmpty) {
      setState(() => _error = 'Fill in all three fields.');
      return;
    }
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
      final session = SessionStore.instance;
      await session.save(session.token!, {...?session.user, 'must_change_password': false});
      if (!mounted) return;
      enterApp(context);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _signOut() async {
    NotificationPoller.instance.stop();
    await EduCheckApi.instance.logout();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  InputDecoration _decoration(String label) => InputDecoration(
        labelText: label,
        fillColor: AppTheme.background,
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.border),
        ),
      );

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: AppTheme.background,
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 30),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Image.asset('assets/images/educheck-logo.png', width: 72, height: 72, semanticLabel: 'EduCheck logo'),
                    const SizedBox(height: 18),
                    const Text(
                      'Set your own password',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppTheme.textDark),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'You signed in with a temporary password. Choose your own to continue; only you will know it.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 13, color: AppTheme.textGray, height: 1.4),
                    ),
                    const SizedBox(height: 24),
                    TextField(
                      controller: _current,
                      obscureText: _obscure,
                      decoration: _decoration('Temporary password'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _next,
                      obscureText: _obscure,
                      decoration: _decoration('New password').copyWith(
                        helperText: 'At least 8 characters, with a letter and a number',
                        suffixIcon: IconButton(
                          tooltip: _obscure ? 'Show passwords' : 'Hide passwords',
                          onPressed: () => setState(() => _obscure = !_obscure),
                          icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined, size: 20),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _confirm,
                      obscureText: _obscure,
                      onSubmitted: (_) => _save(),
                      decoration: _decoration('Confirm new password'),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 10),
                      Text(_error!, style: const TextStyle(color: AppTheme.danger, fontSize: 12.5)),
                    ],
                    const SizedBox(height: 20),
                    FilledButton(
                      onPressed: _saving ? null : _save,
                      style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                      child: _saving
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.2))
                          : const Text('Save and continue'),
                    ),
                    const SizedBox(height: 8),
                    TextButton(onPressed: _saving ? null : _signOut, child: const Text('Not you? Sign out')),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
