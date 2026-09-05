import 'package:flutter/material.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _usernameController =
      TextEditingController();

  final TextEditingController _passwordController =
      TextEditingController();

  bool _obscurePassword = true;

  String _selectedRole = 'subject';

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
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Backend login will be connected next.',
        ),
      ),
    );
  }

  String get _usernameHint {
    switch (_selectedRole) {
      case 'adviser':
        return 'adviser.grade6a';

      case 'admin':
        return 'admin.educheck';

      default:
        return 'math.g6a, english.g6a, etc.';
    }
  }

  String get _buttonText {
    switch (_selectedRole) {
      case 'admin':
        return 'Login to Admin Dashboard';

      default:
        return 'Login to Dashboard';
    }
  }

  Color get _selectedColor {
    switch (_selectedRole) {
      case 'adviser':
        return const Color(0xFF00B84D);

      case 'admin':
        return const Color(0xFFA000FF);

      default:
        return const Color(0xFF246BFE);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF246BFE),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(8),
            child: Container(
              width: double.infinity,
              constraints: const BoxConstraints(
                maxWidth: 450,
              ),
              padding: const EdgeInsets.fromLTRB(
                32,
                32,
                32,
                30,
              ),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [

                  Center(
                    child: Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: const Color(0xFF246BFE),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.15),
                            blurRadius: 8,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.school_outlined,
                        size: 45,
                        color: Colors.white,
                      ),
                    ),
                  ),

                  const SizedBox(height: 18),

                  const Center(
                    child: Text(
                      'EduCheck',
                      style: TextStyle(
                        fontSize: 29,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF246BFE),
                      ),
                    ),
                  ),

                  const SizedBox(height: 3),

                  const Center(
                    child: Text(
                      'Academic Record Validation System',
                      style: TextStyle(
                        fontSize: 15,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ),

                  const SizedBox(height: 10),

                  Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF5FF),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        'Subject-Based RBAC Enabled',
                        style: TextStyle(
                          fontSize: 11,
                          color: Color(0xFF246BFE),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 32),

                  const Text(
                    'Login as',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.black,
                    ),
                  ),

                  const SizedBox(height: 9),

                  Row(
                    children: [
                      Expanded(
                        child: _roleButton(
                          role: 'adviser',
                          icon: Icons.account_circle_outlined,
                          label: 'Adviser',
                        ),
                      ),

                      const SizedBox(width: 10),

                      Expanded(
                        child: _roleButton(
                          role: 'subject',
                          icon: Icons.menu_book_outlined,
                          label: 'Subject',
                        ),
                      ),

                      const SizedBox(width: 10),

                      Expanded(
                        child: _roleButton(
                          role: 'admin',
                          icon: Icons.shield_outlined,
                          label: 'Admin',
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 25),

                  const Text(
                    'Username',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.black,
                    ),
                  ),

                  const SizedBox(height: 9),

                  TextField(
                    controller: _usernameController,
                    decoration: InputDecoration(
                      hintText: _usernameHint,
                      hintStyle: const TextStyle(
                        color: Color(0xFF9CA3AF),
                        fontSize: 15,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(6),
                        borderSide: const BorderSide(
                          color: Color(0xFFD8DFEA),
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(6),
                        borderSide: const BorderSide(
                          color: Color(0xFF246BFE),
                          width: 1.5,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  const Text(
                    'Password',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.black,
                    ),
                  ),

                  const SizedBox(height: 9),

                  TextField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      hintText: 'Enter your password',
                      hintStyle: const TextStyle(
                        color: Color(0xFF9CA3AF),
                        fontSize: 15,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined,
                          color: const Color(0xFF4B5563),
                        ),
                        onPressed: () {
                          setState(() {
                            _obscurePassword =
                                !_obscurePassword;
                          });
                        },
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(6),
                        borderSide: const BorderSide(
                          color: Color(0xFFD8DFEA),
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(6),
                        borderSide: const BorderSide(
                          color: Color(0xFF246BFE),
                          width: 1.5,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: _login,
                      style: ElevatedButton.styleFrom(
                        backgroundColor:
                            const Color(0xFF246BFE),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6),
                        ),
                      ),
                      child: Text(
                        _buttonText,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(13),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0F7FF),
                      border: Border.all(
                        color: const Color(0xFFA9D0FF),
                      ),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Demo Credentials:',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF003B8F),
                          ),
                        ),

                        SizedBox(height: 6),

                        Text(
                          'Adviser: adviser.grade6a / adviser123',
                          style: TextStyle(
                            fontSize: 12,
                            color: Color(0xFF0645D5),
                          ),
                        ),

                        SizedBox(height: 3),

                        Text(
                          'Math Teacher: math.g6a / math123',
                          style: TextStyle(
                            fontSize: 12,
                            color: Color(0xFF0645D5),
                          ),
                        ),

                        SizedBox(height: 3),

                        Text(
                          'English Teacher: english.g6a / eng123',
                          style: TextStyle(
                            fontSize: 12,
                            color: Color(0xFF0645D5),
                          ),
                        ),

                        SizedBox(height: 3),

                        Text(
                          'Science Teacher: science.g6a / sci123',
                          style: TextStyle(
                            fontSize: 12,
                            color: Color(0xFF0645D5),
                          ),
                        ),

                        SizedBox(height: 3),

                        Text(
                          'Filipino Teacher: filipino.g6a / fil123',
                          style: TextStyle(
                            fontSize: 12,
                            color: Color(0xFF0645D5),
                          ),
                        ),

                        SizedBox(height: 3),

                        Text(
                          'Admin: admin.educheck / admin123',
                          style: TextStyle(
                            fontSize: 12,
                            color: Color(0xFF0645D5),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _roleButton({
    required String role,
    required IconData icon,
    required String label,
  }) {
    final bool selected = _selectedRole == role;

    Color roleColor;

    switch (role) {
      case 'adviser':
        roleColor = const Color(0xFF00B84D);
        break;

      case 'admin':
        roleColor = const Color(0xFFA000FF);
        break;

      default:
        roleColor = const Color(0xFF246BFE);
    }

    return GestureDetector(
      onTap: () => _selectRole(role),
      child: Container(
        height: 59,
        decoration: BoxDecoration(
          color: selected
              ? roleColor.withOpacity(0.05)
              : Colors.white,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: selected
                ? roleColor
                : const Color(0xFFD8DFEA),
            width: selected ? 2 : 1,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 21,
              color: selected
                  ? roleColor
                  : const Color(0xFF1F2937),
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: selected
                    ? roleColor
                    : Colors.black,
                fontWeight: selected
                    ? FontWeight.w500
                    : FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }
}