import 'package:flutter/material.dart';

import '../adviser/adviser_dashboard_screen.dart';
import '../subject/subject_dashboard_screen.dart';
import '../admin/admin_dashboard_screen.dart';
import '../principal/principal_dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  static const Color primaryBlue = Color(0xFF1554D1);
  static const Color backgroundColor = Color(0xFFF7F9FC);
  static const Color textColor = Color(0xFF1F2937);
  static const Color secondaryTextColor = Color(0xFF64748B);
  static const Color borderColor = Color(0xFFE2E8F0);

  final TextEditingController _usernameController =
      TextEditingController();

  final TextEditingController _passwordController =
      TextEditingController();

  bool _obscurePassword = true;

  String _selectedRole = 'adviser';

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _selectRole(String role) {
    setState(() {
      _selectedRole = role;
      _usernameController.clear();
      _passwordController.clear();
    });
  }

  void _login() {
    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();

    if (username.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Please enter your username and password.',
          ),
        ),
      );
      return;
    }

    bool validCredentials = false;

    switch (_selectedRole) {
      case 'adviser':
        validCredentials =
            username == 'adviser.grade6a' &&
            password == 'adviser123';
        break;

      case 'subject':
        validCredentials =
            (username == 'math.g6a' && password == 'math123') ||
            (username == 'english.g6a' && password == 'eng123') ||
            (username == 'science.g6a' && password == 'sci123') ||
            (username == 'filipino.g6a' && password == 'fil123');
        break;

      case 'admin':
        validCredentials =
            username == 'admin.educheck' &&
            password == 'admin123';
        break;

      case 'principal':
        validCredentials =
            username == 'principal.educheck' &&
            password == 'principal123';
        break;
    }

    if (!validCredentials) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Invalid username or password.',
          ),
        ),
      );
      return;
    }

    if (_selectedRole == 'adviser') {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) =>
              const AdviserDashboardScreen(),
        ),
      );
      return;
    }

    if (_selectedRole == 'subject') {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) =>
              const SubjectDashboardScreen(),
        ),
      );
      return;
    }

    if (_selectedRole == 'admin') {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) =>
              const AdminDashboardScreen(),
        ),
      );
      return;
    }

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) =>
            const PrincipalDashboardScreen(),
      ),
    );
  }

  String get _usernameHint {
    switch (_selectedRole) {
      case 'adviser':
        return 'adviser.grade6a';
      case 'subject':
        return 'math.g6a, english.g6a, etc.';
      case 'admin':
        return 'admin.educheck';
      case 'principal':
        return 'principal.educheck';
      default:
        return '';
    }
  }

  String get _buttonText {
    switch (_selectedRole) {
      case 'admin':
        return 'Login to Admin Dashboard';
      case 'principal':
        return 'Login to Principal Dashboard';
      default:
        return 'Login to Dashboard';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 30),
            child: ConstrainedBox(
              constraints: const BoxConstraints(
                maxWidth: 440,
              ),
              child: Column(
                children: [
                  _buildLogo(),
                  const SizedBox(height: 16),
                  _buildBranding(),
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
    return Container(
      width: 68,
      height: 68,
      decoration: BoxDecoration(
        color: primaryBlue,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: primaryBlue.withOpacity(0.16),
            blurRadius: 16,
            offset: const Offset(0, 7),
          ),
        ],
      ),
      child: const Icon(
        Icons.school_outlined,
        size: 34,
        color: Colors.white,
      ),
    );
  }

  Widget _buildBranding() {
    return const Column(
      children: [
        Text(
          'EduCheck',
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w700,
            color: primaryBlue,
          ),
        ),
        SizedBox(height: 5),
        Text(
          'Academic Record Validation System',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 11,
            color: secondaryTextColor,
          ),
        ),
      ],
    );
  }

  Widget _buildLoginCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: borderColor,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Welcome back',
            style: TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.w700,
              color: textColor,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Sign in to continue to EduCheck.',
            style: TextStyle(
              fontSize: 11,
              color: secondaryTextColor,
            ),
          ),
          const SizedBox(height: 22),
          const Text(
            'Login as',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: textColor,
            ),
          ),
          const SizedBox(height: 9),
          Row(
            children: [
              Expanded(
                child: _roleButton(
                  role: 'adviser',
                  icon: Icons.person_outline_rounded,
                  label: 'Adviser',
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _roleButton(
                  role: 'subject',
                  icon: Icons.menu_book_outlined,
                  label: 'Subject',
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _roleButton(
                  role: 'admin',
                  icon: Icons.admin_panel_settings_outlined,
                  label: 'Admin',
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _roleButton(
                  role: 'principal',
                  icon: Icons.account_balance_outlined,
                  label: 'Principal',
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _buildFieldLabel('Username'),
          const SizedBox(height: 7),
          TextField(
            controller: _usernameController,
            decoration: _inputDecoration(
              hintText: _usernameHint,
            ),
          ),
          const SizedBox(height: 17),
          _buildFieldLabel('Password'),
          const SizedBox(height: 7),
          TextField(
            controller: _passwordController,
            obscureText: _obscurePassword,
            decoration: _inputDecoration(
              hintText: 'Enter your password',
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                  size: 20,
                  color: secondaryTextColor,
                ),
                onPressed: () {
                  setState(() {
                    _obscurePassword = !_obscurePassword;
                  });
                },
              ),
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: _login,
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryBlue,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(11),
                ),
              ),
              child: Text(
                _buttonText,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          const SizedBox(height: 18),
          _buildDemoCredentials(),
        ],
      ),
    );
  }

  Widget _buildFieldLabel(String label) {
    return Text(
      label,
      style: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: textColor,
      ),
    );
  }

  InputDecoration _inputDecoration({
    required String hintText,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      hintText: hintText,
      hintStyle: const TextStyle(
        fontSize: 11,
        color: Color(0xFF94A3B8),
      ),
      suffixIcon: suffixIcon,
      filled: true,
      fillColor: const Color(0xFFFAFBFC),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: 14,
        vertical: 13,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(11),
        borderSide: const BorderSide(
          color: borderColor,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(11),
        borderSide: const BorderSide(
          color: primaryBlue,
          width: 1.4,
        ),
      ),
    );
  }

  Widget _buildDemoCredentials() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(11),
        border: Border.all(
          color: borderColor,
        ),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Demo Credentials',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: textColor,
            ),
          ),
          SizedBox(height: 7),
          Text(
            'Adviser: adviser.grade6a / adviser123',
            style: TextStyle(
              fontSize: 10,
              color: secondaryTextColor,
            ),
          ),
          SizedBox(height: 3),
          Text(
            'Math Teacher: math.g6a / math123',
            style: TextStyle(
              fontSize: 10,
              color: secondaryTextColor,
            ),
          ),
          SizedBox(height: 3),
          Text(
            'English Teacher: english.g6a / eng123',
            style: TextStyle(
              fontSize: 10,
              color: secondaryTextColor,
            ),
          ),
          SizedBox(height: 3),
          Text(
            'Science Teacher: science.g6a / sci123',
            style: TextStyle(
              fontSize: 10,
              color: secondaryTextColor,
            ),
          ),
          SizedBox(height: 3),
          Text(
            'Filipino Teacher: filipino.g6a / fil123',
            style: TextStyle(
              fontSize: 10,
              color: secondaryTextColor,
            ),
          ),
          SizedBox(height: 3),
          Text(
            'Admin: admin.educheck / admin123',
            style: TextStyle(
              fontSize: 10,
              color: secondaryTextColor,
            ),
          ),
          SizedBox(height: 3),
          Text(
            'Principal: principal.educheck / principal123',
            style: TextStyle(
              fontSize: 10,
              color: secondaryTextColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _roleButton({
    required String role,
    required IconData icon,
    required String label,
  }) {
    final bool selected = _selectedRole == role;

    return GestureDetector(
      onTap: () => _selectRole(role),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        height: 62,
        decoration: BoxDecoration(
          color: selected
              ? const Color(0xFFEFF6FF)
              : Colors.white,
          borderRadius: BorderRadius.circular(11),
          border: Border.all(
            color: selected
                ? primaryBlue
                : borderColor,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 20,
              color: selected
                  ? primaryBlue
                  : secondaryTextColor,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: selected
                    ? FontWeight.w700
                    : FontWeight.w500,
                color: selected
                    ? primaryBlue
                    : textColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}