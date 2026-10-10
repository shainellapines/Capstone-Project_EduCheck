import 'package:flutter/material.dart';

import '../../app.dart';
import '../../core/api/educheck_api.dart';
import '../../core/session/session_store.dart';
import '../../core/theme/app_theme.dart';

/// SPMP M-01: the same accounts and JWT login as the web platform. The
/// dashboard shown afterwards follows the role the backend returns.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, this.sessionExpired = false});

  final bool sessionExpired;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  static const Color _borderColor = AppTheme.border;

  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _serverController = TextEditingController(text: SessionStore.instance.baseUrl);

  bool _obscurePassword = true;
  bool _loading = false;
  bool _showServer = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.sessionExpired) _error = 'Your session has expired. Please log in again.';
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _serverController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final username = _usernameController.text.trim();
    final password = _passwordController.text;

    if (username.isEmpty || password.isEmpty) {
      setState(() => _error = 'Please enter your username and password.');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final server = _serverController.text.trim();
      if (server.isNotEmpty && server != SessionStore.instance.baseUrl) {
        await SessionStore.instance.setBaseUrl(server);
      }
      await EduCheckApi.instance.login(username, password);
      if (!mounted) return;
      enterApp(context);
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 30),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                children: [
                  _buildLogo(),
                  const SizedBox(height: 16),
                  const Text(
                    'EduCheck',
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: AppTheme.primary),
                  ),
                  const SizedBox(height: 5),
                  const Text(
                    'Academic Record Management - Mobile Companion',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: AppTheme.textGray),
                  ),
                  const SizedBox(height: 28),
                  _buildLoginCard(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLogo() {
    return Image.asset(
      'assets/images/educheck-logo.png',
      width: 88,
      height: 88,
      semanticLabel: 'EduCheck logo',
    );
  }

  Widget _buildLoginCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _borderColor),
        boxShadow: [
          BoxShadow(color: AppTheme.textDark.withValues(alpha: 0.03), blurRadius: 18, offset: const Offset(0, 6)),
        ],
      ),
      child: AutofillGroup(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Welcome back',
              style: TextStyle(fontSize: 19, fontWeight: FontWeight.w700, color: AppTheme.textDark),
            ),
            const SizedBox(height: 4),
            const Text(
              'Sign in with your EduCheck account.',
              style: TextStyle(fontSize: 12, color: AppTheme.textGray),
            ),
            const SizedBox(height: 22),
            if (_error != null) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.dangerBg,
                  borderRadius: BorderRadius.circular(11),
                  border: Border.all(color: AppTheme.dangerBorder),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.error_outline_rounded, size: 18, color: AppTheme.danger),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _error!,
                        style: const TextStyle(fontSize: 12, color: AppTheme.danger, height: 1.35),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],
            _label('Username'),
            const SizedBox(height: 7),
            TextField(
              controller: _usernameController,
              autofillHints: const [AutofillHints.username],
              textInputAction: TextInputAction.next,
              decoration: _inputDecoration(hintText: 'e.g. adviser.grade6a'),
            ),
            const SizedBox(height: 17),
            _label('Password'),
            const SizedBox(height: 7),
            TextField(
              controller: _passwordController,
              obscureText: _obscurePassword,
              autofillHints: const [AutofillHints.password],
              onSubmitted: (_) => _login(),
              decoration: _inputDecoration(
                hintText: 'Enter your password',
                suffixIcon: IconButton(
                  tooltip: _obscurePassword ? 'Show password' : 'Hide password',
                  icon: Icon(
                    _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                    size: 20,
                    color: AppTheme.textGray,
                  ),
                  onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                ),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _loading ? null : _login,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: AppTheme.onPrimary,
                  disabledBackgroundColor: AppTheme.primary.withValues(alpha: 0.6),
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(11)),
                ),
                child: _loading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2.2, color: AppTheme.onPrimary),
                      )
                    : const Text('Log In', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
              ),
            ),
            const SizedBox(height: 14),
            Center(
              child: TextButton.icon(
                onPressed: () => setState(() => _showServer = !_showServer),
                icon: const Icon(Icons.dns_outlined, size: 16),
                label: Text(_showServer ? 'Hide server address' : 'Server address'),
                style: TextButton.styleFrom(foregroundColor: AppTheme.textGray),
              ),
            ),
            if (_showServer) ...[
              const SizedBox(height: 4),
              TextField(
                controller: _serverController,
                keyboardType: TextInputType.url,
                decoration: _inputDecoration(hintText: 'http://192.168.1.10:5000'),
              ),
              const SizedBox(height: 6),
              const Text(
                'Emulator: http://10.0.2.2:5000. On a phone, use your PC\'s Wi-Fi address '
                '(same network) with port 5000.',
                style: TextStyle(fontSize: 11, color: AppTheme.textGray, height: 1.4),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _label(String label) {
    return Text(
      label,
      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textDark),
    );
  }

  InputDecoration _inputDecoration({required String hintText, Widget? suffixIcon}) {
    return InputDecoration(
      hintText: hintText,
      hintStyle: const TextStyle(fontSize: 12, color: AppTheme.textGray),
      suffixIcon: suffixIcon,
      filled: true,
      fillColor: AppTheme.background,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(11),
        borderSide: const BorderSide(color: _borderColor),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(11),
        borderSide: const BorderSide(color: AppTheme.primary, width: 1.4),
      ),
    );
  }
}
