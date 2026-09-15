import 'package:flutter/material.dart';
import 'reports_screen.dart';
import 'admin_dashboard_screen.dart';

class UserManagementScreen extends StatefulWidget {
  const UserManagementScreen({super.key});

  @override
  State<UserManagementScreen> createState() => _UserManagementScreenState();
}

class _UserManagementScreenState extends State<UserManagementScreen> {
  String selectedRole = 'All Roles';
  String selectedStatus = 'All Status';
  String searchQuery = '';

  final List<Map<String, dynamic>> users = [
    {
      'name': 'Ms. Maria Santos',
      'username': 'msantos',
      'role': 'Teacher',
      'status': 'Active',
      'created': '1/15/2025',
      'lastLogin': '4/15/2026',
    },
    {
      'name': 'Mr. Juan Dela Cruz',
      'username': 'jdelacruz',
      'role': 'Teacher',
      'status': 'Active',
      'created': '2/1/2025',
      'lastLogin': '4/14/2026',
    },
    {
      'name': 'Admin User',
      'username': 'admin',
      'role': 'Administrator',
      'status': 'Active',
      'created': '12/1/2024',
      'lastLogin': '4/16/2026',
    },
    {
      'name': 'Ms. Ana Reyes',
      'username': 'areyes',
      'role': 'Teacher',
      'status': 'Inactive',
      'created': '3/10/2025',
      'lastLogin': '3/20/2026',
    },
  ];

  List<Map<String, dynamic>> get filteredUsers {
    return users.where((user) {
      final query = searchQuery.toLowerCase();

      final matchesSearch =
          query.isEmpty ||
          user['name'].toString().toLowerCase().contains(query) ||
          user['username'].toString().toLowerCase().contains(query);

      final matchesRole =
          selectedRole == 'All Roles' || user['role'] == selectedRole;

      final matchesStatus =
          selectedStatus == 'All Status' || user['status'] == selectedStatus;

      return matchesSearch && matchesRole && matchesStatus;
    }).toList();
  }

  int get totalUsers => users.length;

  int get activeUsers =>
      users.where((user) => user['status'] == 'Active').length;

  int get teacherCount =>
      users.where((user) => user['role'] == 'Teacher').length;

  int get administratorCount =>
      users.where((user) => user['role'] == 'Administrator').length;

  void navigateTo(int index) {
    if (index == 0) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => const AdminDashboardScreen(),
        ),
      );
    } else if (index == 1) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => const ReportsScreen(),
        ),
      );
    }
  }

  void showAddUserDialog() {
    final nameController = TextEditingController();
    final usernameController = TextEditingController();
    final passwordController = TextEditingController();

    String role = 'Teacher';
    String status = 'Active';
    bool obscurePassword = true;

    showDialog(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text(
                'Add New User',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: nameController,
                      decoration: const InputDecoration(
                        labelText: 'Name',
                        hintText: 'Enter full name',
                      ),
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: usernameController,
                      decoration: const InputDecoration(
                        labelText: 'Username',
                        hintText: 'Enter username',
                      ),
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: passwordController,
                      obscureText: obscurePassword,
                      decoration: InputDecoration(
                        labelText: 'Password',
                        hintText: 'Enter password',
                        suffixIcon: IconButton(
                          onPressed: () {
                            setDialogState(() {
                              obscurePassword = !obscurePassword;
                            });
                          },
                          icon: Icon(
                            obscurePassword
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    DropdownButtonFormField<String>(
                      value: role,
                      decoration: const InputDecoration(
                        labelText: 'Role',
                      ),
                      items: const [
                        DropdownMenuItem(
                          value: 'Teacher',
                          child: Text('Teacher'),
                        ),
                        DropdownMenuItem(
                          value: 'Administrator',
                          child: Text('Administrator'),
                        ),
                      ],
                      onChanged: (value) {
                        setDialogState(() {
                          role = value!;
                        });
                      },
                    ),
                    const SizedBox(height: 14),
                    DropdownButtonFormField<String>(
                      value: status,
                      decoration: const InputDecoration(
                        labelText: 'Status',
                      ),
                      items: const [
                        DropdownMenuItem(
                          value: 'Active',
                          child: Text('Active'),
                        ),
                        DropdownMenuItem(
                          value: 'Inactive',
                          child: Text('Inactive'),
                        ),
                      ],
                      onChanged: (value) {
                        setDialogState(() {
                          status = value!;
                        });
                      },
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.pop(dialogContext);
                  },
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () {
                    if (nameController.text.trim().isEmpty ||
                        usernameController.text.trim().isEmpty ||
                        passwordController.text.trim().isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text(
                            'Please complete all required fields.',
                          ),
                        ),
                      );
                      return;
                    }

                    setState(() {
                      users.add({
                        'name': nameController.text.trim(),
                        'username': usernameController.text.trim(),
                        'role': role,
                        'status': status,
                        'created': '4/17/2026',
                        'lastLogin': '-',
                      });
                    });

                    Navigator.pop(dialogContext);

                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'User account created successfully.',
                        ),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1554D1),
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Create User'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void showEditUserDialog(Map<String, dynamic> user) {
    final nameController = TextEditingController(
      text: user['name'].toString(),
    );

    final usernameController = TextEditingController(
      text: user['username'].toString(),
    );

    String role = user['role'].toString();
    String status = user['status'].toString();

    showDialog(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text(
                'Edit User',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: nameController,
                      decoration: const InputDecoration(
                        labelText: 'Name',
                      ),
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: usernameController,
                      decoration: const InputDecoration(
                        labelText: 'Username',
                      ),
                    ),
                    const SizedBox(height: 14),
                    DropdownButtonFormField<String>(
                      value: role,
                      decoration: const InputDecoration(
                        labelText: 'Role',
                      ),
                      items: const [
                        DropdownMenuItem(
                          value: 'Teacher',
                          child: Text('Teacher'),
                        ),
                        DropdownMenuItem(
                          value: 'Administrator',
                          child: Text('Administrator'),
                        ),
                      ],
                      onChanged: (value) {
                        setDialogState(() {
                          role = value!;
                        });
                      },
                    ),
                    const SizedBox(height: 14),
                    DropdownButtonFormField<String>(
                      value: status,
                      decoration: const InputDecoration(
                        labelText: 'Status',
                      ),
                      items: const [
                        DropdownMenuItem(
                          value: 'Active',
                          child: Text('Active'),
                        ),
                        DropdownMenuItem(
                          value: 'Inactive',
                          child: Text('Inactive'),
                        ),
                      ],
                      onChanged: (value) {
                        setDialogState(() {
                          status = value!;
                        });
                      },
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.pop(dialogContext);
                  },
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () {
                    setState(() {
                      user['name'] = nameController.text.trim();
                      user['username'] = usernameController.text.trim();
                      user['role'] = role;
                      user['status'] = status;
                    });

                    Navigator.pop(dialogContext);

                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'User account updated successfully.',
                        ),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1554D1),
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Save Changes'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void showUserDetails(Map<String, dynamic> user) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(22),
        ),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 30),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 25,
                    backgroundColor: const Color(0xFFEAF2FF),
                    child: Icon(
                      user['role'] == 'Administrator'
                          ? Icons.admin_panel_settings_outlined
                          : Icons.person_outline,
                      color: const Color(0xFF1554D1),
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      user['name'],
                      style: const TextStyle(
                        fontSize: 19,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF172033),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 22),
              buildDetailRow('Username', user['username']),
              buildDetailRow('Role', user['role']),
              buildDetailRow('Status', user['status']),
              buildDetailRow('Created Date', user['created']),
              buildDetailRow('Last Login', user['lastLogin']),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    showEditUserDialog(user);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1554D1),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: const Text(
                    'Edit User',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 13),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF6B7280),
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF172033),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void toggleUserStatus(Map<String, dynamic> user) {
    setState(() {
      user['status'] =
          user['status'] == 'Active' ? 'Inactive' : 'Active';
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          '${user['name']} is now ${user['status']}.',
        ),
      ),
    );
  }

  void deleteUser(Map<String, dynamic> user) {
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text(
            'Delete User',
            style: TextStyle(
              fontWeight: FontWeight.bold,
            ),
          ),
          content: Text(
            'Are you sure you want to delete ${user['name']}?',
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext);
              },
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  users.remove(user);
                });

                Navigator.pop(dialogContext);

                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('User account deleted.'),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFDC2626),
                foregroundColor: Colors.white,
              ),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );
  }

  Widget buildHeader() {
    return Container(
      height: 56,
      width: double.infinity,
      color: const Color(0xFF1554D1),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      alignment: Alignment.centerLeft,
      child: const Text(
        'User Management',
        style: TextStyle(
          color: Colors.white,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget buildBottomNavigation() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 68,
          child: Row(
            children: [
              buildNavItem(
                0,
                Icons.home_outlined,
                Icons.home,
                'Home',
              ),
              buildNavItem(
                1,
                Icons.bar_chart_outlined,
                Icons.bar_chart,
                'Reports',
              ),
              buildNavItem(
                2,
                Icons.people_outline,
                Icons.people,
                'User Management',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget buildNavItem(
    int index,
    IconData inactiveIcon,
    IconData activeIcon,
    String label,
  ) {
    final bool selected = index == 2;

    return Expanded(
      child: InkWell(
        onTap: () {
          navigateTo(index);
        },
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              selected ? activeIcon : inactiveIcon,
              size: 23,
              color: selected
                  ? const Color(0xFF1554D1)
                  : const Color(0xFF777777),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 10,
                fontWeight:
                    selected ? FontWeight.w600 : FontWeight.w500,
                color: selected
                    ? const Color(0xFF1554D1)
                    : const Color(0xFF777777),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget buildPageTitle() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'User Management',
          style: TextStyle(
            fontSize: 26,
            fontWeight: FontWeight.bold,
            color: Color(0xFF172033),
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Manage system users and access control',
          style: TextStyle(
            fontSize: 14,
            color: Color(0xFF6B7280),
          ),
        ),
        const SizedBox(height: 18),
        SizedBox(
          height: 46,
          child: ElevatedButton.icon(
            onPressed: showAddUserDialog,
            icon: const Icon(
              Icons.person_add_alt_1,
              size: 19,
            ),
            label: const Text(
              'Add New User',
              style: TextStyle(
                fontWeight: FontWeight.bold,
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1554D1),
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(
                horizontal: 16,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget buildSummaryCards() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: buildSummaryCard(
                title: 'Total Users',
                value: totalUsers.toString(),
                icon: Icons.people_outline,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: buildSummaryCard(
                title: 'Active Users',
                value: activeUsers.toString(),
                icon: Icons.verified_user_outlined,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: buildSummaryCard(
                title: 'Teachers',
                value: teacherCount.toString(),
                icon: Icons.school_outlined,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: buildSummaryCard(
                title: 'Administrators',
                value: administratorCount.toString(),
                icon: Icons.admin_panel_settings_outlined,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget buildSummaryCard({
    required String title,
    required String value,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: const Color(0xFFE3E7EF),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: const Color(0xFFEAF2FF),
              borderRadius: BorderRadius.circular(11),
            ),
            child: Icon(
              icon,
              color: const Color(0xFF1554D1),
              size: 22,
            ),
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF172033),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget buildSearchAndFilters() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFE3E7EF),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Search',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF172033),
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            onChanged: (value) {
              setState(() {
                searchQuery = value;
              });
            },
            decoration: InputDecoration(
              hintText: 'Search by name or username',
              prefixIcon: const Icon(
                Icons.search,
                color: Color(0xFF6B7280),
              ),
              filled: true,
              fillColor: const Color(0xFFF8FAFC),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 13,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(
                  color: Color(0xFFDDE3EC),
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(
                  color: Color(0xFFDDE3EC),
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(
                  color: Color(0xFF1554D1),
                  width: 1.5,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          buildDropdown(
            label: 'Role',
            value: selectedRole,
            items: const [
              'All Roles',
              'Teacher',
              'Administrator',
            ],
            onChanged: (value) {
              setState(() {
                selectedRole = value!;
              });
            },
          ),
          const SizedBox(height: 14),
          buildDropdown(
            label: 'Status',
            value: selectedStatus,
            items: const [
              'All Status',
              'Active',
              'Inactive',
            ],
            onChanged: (value) {
              setState(() {
                selectedStatus = value!;
              });
            },
          ),
        ],
      ),
    );
  }

  Widget buildDropdown({
    required String label,
    required String value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Color(0xFF374151),
          ),
        ),
        const SizedBox(height: 7),
        DropdownButtonFormField<String>(
          value: value,
          isExpanded: true,
          decoration: InputDecoration(
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 13,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(
                color: Color(0xFFDDE3EC),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(
                color: Color(0xFFDDE3EC),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(
                color: Color(0xFF1554D1),
                width: 1.5,
              ),
            ),
          ),
          icon: const Icon(
            Icons.keyboard_arrow_down,
            color: Color(0xFF6B7280),
          ),
          items: items.map((item) {
            return DropdownMenuItem<String>(
              value: item,
              child: Text(
                item,
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF172033),
                ),
              ),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget buildUserAccounts() {
    final displayedUsers = filteredUsers;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFE3E7EF),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'User Accounts',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF172033),
            ),
          ),
          const SizedBox(height: 16),
          if (displayedUsers.isEmpty)
            buildEmptyState()
          else
            buildUserTable(displayedUsers),
        ],
      ),
    );
  }

  Widget buildEmptyState() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
        vertical: 35,
        horizontal: 20,
      ),
      child: const Column(
        children: [
          Icon(
            Icons.people_outline,
            size: 44,
            color: Color(0xFF9CA3AF),
          ),
          SizedBox(height: 10),
          Text(
            'No users found.',
            style: TextStyle(
              fontSize: 14,
              color: Color(0xFF6B7280),
            ),
          ),
        ],
      ),
    );
  }

  Widget buildUserTable(List<Map<String, dynamic>> displayedUsers) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        border: Border.all(
          color: const Color(0xFFDDE3EC),
        ),
        borderRadius: BorderRadius.circular(10),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          headingRowColor: WidgetStateProperty.all(
            const Color(0xFFF1F5F9),
          ),
          dataRowMinHeight: 62,
          dataRowMaxHeight: 76,
          columnSpacing: 22,
          headingTextStyle: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: Color(0xFF374151),
          ),
          dataTextStyle: const TextStyle(
            fontSize: 12,
            color: Color(0xFF374151),
          ),
          columns: const [
            DataColumn(
              label: Text('Name'),
            ),
            DataColumn(
              label: Text('Username'),
            ),
            DataColumn(
              label: Text('Role'),
            ),
            DataColumn(
              label: Text('Status'),
            ),
            DataColumn(
              label: Text('Created Date'),
            ),
            DataColumn(
              label: Text('Last Login'),
            ),
            DataColumn(
              label: Text('Actions'),
            ),
          ],
          rows: displayedUsers.map((user) {
            return DataRow(
              cells: [
                DataCell(
                  Text(
                    user['name'],
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF172033),
                    ),
                  ),
                ),
                DataCell(
                  Text(
                    user['username'],
                  ),
                ),
                DataCell(
                  buildRoleChip(
                    user['role'],
                  ),
                ),
                DataCell(
                  buildUserStatusChip(
                    user['status'],
                  ),
                ),
                DataCell(
                  Text(
                    user['created'],
                  ),
                ),
                DataCell(
                  Text(
                    user['lastLogin'],
                  ),
                ),
                DataCell(
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        onPressed: () {
                          showUserDetails(user);
                        },
                        tooltip: 'View',
                        icon: const Icon(
                          Icons.visibility_outlined,
                          size: 19,
                        ),
                        color: const Color(0xFF1554D1),
                      ),
                      IconButton(
                        onPressed: () {
                          showEditUserDialog(user);
                        },
                        tooltip: 'Edit',
                        icon: const Icon(
                          Icons.edit_outlined,
                          size: 19,
                        ),
                        color: const Color(0xFF1554D1),
                      ),
                      IconButton(
                        onPressed: () {
                          toggleUserStatus(user);
                        },
                        tooltip: user['status'] == 'Active'
                            ? 'Deactivate'
                            : 'Activate',
                        icon: Icon(
                          user['status'] == 'Active'
                              ? Icons.block_outlined
                              : Icons.check_circle_outline,
                          size: 19,
                        ),
                        color: user['status'] == 'Active'
                            ? const Color(0xFFDC2626)
                            : const Color(0xFF15803D),
                      ),
                      IconButton(
                        onPressed: () {
                          deleteUser(user);
                        },
                        tooltip: 'Delete',
                        icon: const Icon(
                          Icons.delete_outline,
                          size: 19,
                        ),
                        color: const Color(0xFFDC2626),
                      ),
                    ],
                  ),
                ),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget buildRoleChip(String role) {
    final isAdmin = role == 'Administrator';

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 9,
        vertical: 5,
      ),
      decoration: BoxDecoration(
        color: isAdmin
            ? const Color(0xFFEDE9FE)
            : const Color(0xFFEAF2FF),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        role,
        style: TextStyle(
          color: isAdmin
              ? const Color(0xFF6D28D9)
              : const Color(0xFF1554D1),
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget buildUserStatusChip(String status) {
    final isActive = status == 'Active';

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 9,
        vertical: 5,
      ),
      decoration: BoxDecoration(
        color: isActive
            ? const Color(0xFFE8F7EE)
            : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: isActive
              ? const Color(0xFF15803D)
              : const Color(0xFF64748B),
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FC),
      body: SafeArea(
        child: Column(
          children: [
            buildHeader(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    buildPageTitle(),
                    const SizedBox(height: 20),
                    buildSummaryCards(),
                    const SizedBox(height: 24),
                    buildSearchAndFilters(),
                    const SizedBox(height: 24),
                    buildUserAccounts(),
                    const SizedBox(height: 30),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: buildBottomNavigation(),
    );
  }
}