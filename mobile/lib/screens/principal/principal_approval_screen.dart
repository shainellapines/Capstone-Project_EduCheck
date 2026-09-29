import 'package:flutter/material.dart';

import 'principal_dashboard_screen.dart';
import 'principal_analytics_screen.dart';

class PrincipalApprovalScreen extends StatefulWidget {
  const PrincipalApprovalScreen({super.key});

  @override
  State<PrincipalApprovalScreen> createState() =>
      _PrincipalApprovalScreenState();
}

class _PrincipalApprovalScreenState
    extends State<PrincipalApprovalScreen> {
  static const Color primaryBlue = Color(0xFF1554D1);
  static const Color backgroundColor = Color(0xFFF7F9FC);
  static const Color textColor = Color(0xFF1F2937);
  static const Color secondaryTextColor = Color(0xFF64748B);

  String selectedFilter = 'All';

  final List<Map<String, dynamic>> records = [
    {
      'section': 'Grade 6 - Sampaguita',
      'quarter': '2nd Quarter',
      'schoolYear': '2025-2026',
      'adviser': 'Maria Santos',
      'students': 3,
      'status': 'Pending Approval',
      'submitted': 'April 8, 2026 at 10:30 AM',
    },
    {
      'section': 'Grade 5 - Gumamela',
      'quarter': '3rd Quarter',
      'schoolYear': '2025-2026',
      'adviser': 'Liza Cruz',
      'students': 2,
      'status': 'Approved',
      'submitted': 'April 7, 2026 at 2:15 PM',
    },
    {
      'section': 'Grade 6 - Rosal',
      'quarter': '3rd Quarter',
      'schoolYear': '2025-2026',
      'adviser': 'Ana Reyes',
      'students': 3,
      'status': 'Returned',
      'submitted': 'April 6, 2026 at 9:20 AM',
    },
  ];

  List<Map<String, dynamic>> get filteredRecords {
    if (selectedFilter == 'All') {
      return records;
    }

    return records
        .where((record) => record['status'] == selectedFilter)
        .toList();
  }

  void selectNavigation(int index) {
    if (index == 0) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => const PrincipalDashboardScreen(),
        ),
      );
      return;
    }

    if (index == 2) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => const PrincipalAnalyticsScreen(),
        ),
      );
      return;
    }
  }

  void approveRecord(Map<String, dynamic> record) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
          title: const Text(
            'Approve Record',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          content: Text(
            'Are you sure you want to approve the ${record['quarter']} record for ${record['section']}?',
            style: const TextStyle(
              fontSize: 13,
              color: secondaryTextColor,
              height: 1.4,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text(
                'Cancel',
                style: TextStyle(
                  color: secondaryTextColor,
                ),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  record['status'] = 'Approved';
                });

                Navigator.pop(context);

                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Record approved successfully.',
                    ),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryBlue,
                foregroundColor: Colors.white,
                elevation: 0,
              ),
              child: const Text('Approve'),
            ),
          ],
        );
      },
    );
  }

  void returnRecord(Map<String, dynamic> record) {
    final TextEditingController reasonController =
        TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
          title: const Text(
            'Return Record',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Enter a reason for returning this record.',
                style: TextStyle(
                  fontSize: 12,
                  color: secondaryTextColor,
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: reasonController,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'Reason',
                  hintStyle: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF94A3B8),
                  ),
                  filled: true,
                  fillColor: backgroundColor,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(
                      color: Color(0xFFE2E8F0),
                    ),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(
                      color: Color(0xFFE2E8F0),
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(
                      color: primaryBlue,
                    ),
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text(
                'Cancel',
                style: TextStyle(
                  color: secondaryTextColor,
                ),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  record['status'] = 'Returned';
                });

                Navigator.pop(context);

                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Record returned for revision.',
                    ),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFDC2626),
                foregroundColor: Colors.white,
                elevation: 0,
              ),
              child: const Text('Return'),
            ),
          ],
        );
      },
    );
  }

  void showRecordDetails(Map<String, dynamic> record) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(24),
        ),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(
              20,
              12,
              20,
              24,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 42,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFFD1D5DB),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Record Details',
                  style: TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
                const SizedBox(height: 18),
                _buildDetailRow(
                  'Section',
                  record['section'],
                ),
                _buildDetailRow(
                  'Quarter',
                  record['quarter'],
                ),
                _buildDetailRow(
                  'School Year',
                  record['schoolYear'],
                ),
                _buildDetailRow(
                  'Adviser',
                  record['adviser'],
                ),
                _buildDetailRow(
                  'Students',
                  '${record['students']} students',
                ),
                _buildDetailRow(
                  'Status',
                  record['status'],
                ),
                _buildDetailRow(
                  'Submitted',
                  record['submitted'],
                ),
                const SizedBox(height: 8),
                if (record['status'] == 'Pending Approval')
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            Navigator.pop(context);
                            returnRecord(record);
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor:
                                const Color(0xFFDC2626),
                            side: const BorderSide(
                              color: Color(0xFFFCA5A5),
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius:
                                  BorderRadius.circular(10),
                            ),
                            padding:
                                const EdgeInsets.symmetric(
                              vertical: 12,
                            ),
                          ),
                          child: const Text(
                            'Return',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.pop(context);
                            approveRecord(record);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: primaryBlue,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius:
                                  BorderRadius.circular(10),
                            ),
                            padding:
                                const EdgeInsets.symmetric(
                              vertical: 12,
                            ),
                          ),
                          child: const Text(
                            'Approve',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(
    String label,
    String value,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 13),
      child: Row(
        crossAxisAlignment:
            CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                color: secondaryTextColor,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: textColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(
            16,
            12,
            16,
            24,
          ),
          child: Column(
            crossAxisAlignment:
                CrossAxisAlignment.start,
            children: [
              _buildPageHeader(),
              const SizedBox(height: 20),
              _buildSummary(),
              const SizedBox(height: 20),
              _buildFilter(),
              const SizedBox(height: 16),
              if (filteredRecords.isEmpty)
                _buildEmptyState()
              else
                ...filteredRecords.map(
                  (record) => Padding(
                    padding:
                        const EdgeInsets.only(bottom: 12),
                    child:
                        _buildApprovalCard(record),
                  ),
                ),
            ],
          ),
        ),
      ),
      bottomNavigationBar:
          _buildBottomNavigationBar(),
    );
  }

  Widget _buildPageHeader() {
    return Row(
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius:
                BorderRadius.circular(12),
            border: Border.all(
              color: const Color(0xFFE2E8F0),
            ),
          ),
          child: const Icon(
            Icons.fact_check_outlined,
            color: primaryBlue,
            size: 21,
          ),
        ),
        const SizedBox(width: 12),
        const Expanded(
          child: Column(
            crossAxisAlignment:
                CrossAxisAlignment.start,
            children: [
              Text(
                'Approvals',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: textColor,
                ),
              ),
              SizedBox(height: 2),
              Text(
                'Review submitted school records.',
                style: TextStyle(
                  fontSize: 10,
                  color: secondaryTextColor,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSummary() {
    final pending = records
        .where(
          (record) =>
              record['status'] == 'Pending Approval',
        )
        .length;

    final approved = records
        .where(
          (record) =>
              record['status'] == 'Approved',
        )
        .length;

    final returned = records
        .where(
          (record) =>
              record['status'] == 'Returned',
        )
        .length;

    return Row(
      children: [
        Expanded(
          child: _buildSummaryCard(
            value: '$pending',
            label: 'Pending',
            icon: Icons.pending_actions_rounded,
            iconColor:
                const Color(0xFFD97706),
            iconBackground:
                const Color(0xFFFFF7ED),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildSummaryCard(
            value: '$approved',
            label: 'Approved',
            icon:
                Icons.check_circle_outline_rounded,
            iconColor:
                const Color(0xFF16A34A),
            iconBackground:
                const Color(0xFFF0FDF4),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildSummaryCard(
            value: '$returned',
            label: 'Returned',
            icon:
                Icons.assignment_return_outlined,
            iconColor:
                const Color(0xFFDC2626),
            iconBackground:
                const Color(0xFFFEF2F2),
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryCard({
    required String value,
    required String label,
    required IconData icon,
    required Color iconColor,
    required Color iconBackground,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius:
            BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: iconBackground,
              borderRadius:
                  BorderRadius.circular(9),
            ),
            child: Icon(
              icon,
              color: iconColor,
              size: 18,
            ),
          ),
          const SizedBox(height: 9),
          Text(
            value,
            style: const TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              fontSize: 9,
              color: secondaryTextColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilter() {
    const filters = [
      'All',
      'Pending Approval',
      'Approved',
      'Returned',
    ];

    return SizedBox(
      height: 38,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: filters.length,
        separatorBuilder: (_, __) =>
            const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final filter = filters[index];
          final isSelected =
              selectedFilter == filter;

          return GestureDetector(
            onTap: () {
              setState(() {
                selectedFilter = filter;
              });
            },
            child: Container(
              padding:
                  const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 9,
              ),
              decoration: BoxDecoration(
                color: isSelected
                    ? primaryBlue
                    : Colors.white,
                borderRadius:
                    BorderRadius.circular(10),
                border: Border.all(
                  color: isSelected
                      ? primaryBlue
                      : const Color(
                          0xFFE2E8F0,
                        ),
                ),
              ),
              child: Text(
                filter,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight:
                      FontWeight.w600,
                  color: isSelected
                      ? Colors.white
                      : secondaryTextColor,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildApprovalCard(
    Map<String, dynamic> record,
  ) {
    final status = record['status'];

    Color statusColor;
    Color statusBackground;
    IconData statusIcon;

    if (status == 'Approved') {
      statusColor =
          const Color(0xFF16A34A);
      statusBackground =
          const Color(0xFFF0FDF4);
      statusIcon =
          Icons.check_circle_outline_rounded;
    } else if (status == 'Returned') {
      statusColor =
          const Color(0xFFDC2626);
      statusBackground =
          const Color(0xFFFEF2F2);
      statusIcon =
          Icons.assignment_return_outlined;
    } else {
      statusColor =
          const Color(0xFFD97706);
      statusBackground =
          const Color(0xFFFFF7ED);
      statusIcon =
          Icons.pending_actions_rounded;
    }

    return GestureDetector(
      onTap: () {
        showRecordDetails(record);
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius:
              BorderRadius.circular(16),
          border: Border.all(
            color:
                status == 'Pending Approval'
                    ? const Color(0xFFFDE68A)
                    : const Color(
                        0xFFE2E8F0,
                      ),
          ),
        ),
        child: Column(
          crossAxisAlignment:
              CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color:
                        const Color(0xFFEAF1FF),
                    borderRadius:
                        BorderRadius.circular(
                      11,
                    ),
                  ),
                  child: const Icon(
                    Icons.description_outlined,
                    color: primaryBlue,
                    size: 21,
                  ),
                ),
                const SizedBox(width: 11),
                Expanded(
                  child: Column(
                    crossAxisAlignment:
                        CrossAxisAlignment.start,
                    children: [
                      Text(
                        record['section'],
                        style:
                            const TextStyle(
                          fontSize: 13,
                          fontWeight:
                              FontWeight.bold,
                          color: textColor,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        '${record['quarter']} • ${record['schoolYear']}',
                        style:
                            const TextStyle(
                          fontSize: 10,
                          color:
                              secondaryTextColor,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 5,
                  ),
                  decoration:
                      BoxDecoration(
                    color:
                        statusBackground,
                    borderRadius:
                        BorderRadius.circular(
                      7,
                    ),
                  ),
                  child: Row(
                    mainAxisSize:
                        MainAxisSize.min,
                    children: [
                      Icon(
                        statusIcon,
                        size: 12,
                        color:
                            statusColor,
                      ),
                      const SizedBox(
                        width: 4,
                      ),
                      Text(
                        status ==
                                'Pending Approval'
                            ? 'Pending'
                            : status,
                        style: TextStyle(
                          fontSize: 8,
                          fontWeight:
                              FontWeight.w600,
                          color:
                              statusColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            const Divider(
              height: 1,
              color: Color(0xFFE2E8F0),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(
                  Icons.person_outline_rounded,
                  size: 15,
                  color: secondaryTextColor,
                ),
                const SizedBox(width: 5),
                Expanded(
                  child: Text(
                    record['adviser'],
                    style:
                        const TextStyle(
                      fontSize: 10,
                      color:
                          secondaryTextColor,
                    ),
                  ),
                ),
                const Icon(
                  Icons.groups_outlined,
                  size: 15,
                  color: secondaryTextColor,
                ),
                const SizedBox(width: 5),
                Text(
                  '${record['students']} students',
                  style:
                      const TextStyle(
                    fontSize: 10,
                    color:
                        secondaryTextColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(
                  Icons.access_time_rounded,
                  size: 14,
                  color: secondaryTextColor,
                ),
                const SizedBox(width: 5),
                Expanded(
                  child: Text(
                    record['submitted'],
                    style:
                        const TextStyle(
                      fontSize: 9,
                      color:
                          secondaryTextColor,
                    ),
                  ),
                ),
              ],
            ),
            if (status ==
                'Pending Approval') ...[
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        returnRecord(record);
                      },
                      style:
                          OutlinedButton.styleFrom(
                        foregroundColor:
                            const Color(
                          0xFFDC2626,
                        ),
                        side:
                            const BorderSide(
                          color: Color(
                            0xFFFCA5A5,
                          ),
                        ),
                        shape:
                            RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius
                                  .circular(
                            10,
                          ),
                        ),
                        padding:
                            const EdgeInsets
                                .symmetric(
                          vertical: 10,
                        ),
                      ),
                      child: const Text(
                        'Return',
                        style:
                            TextStyle(
                          fontSize: 10,
                          fontWeight:
                              FontWeight
                                  .w600,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 9),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        approveRecord(record);
                      },
                      style:
                          ElevatedButton.styleFrom(
                        backgroundColor:
                            primaryBlue,
                        foregroundColor:
                            Colors.white,
                        elevation: 0,
                        shape:
                            RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius
                                  .circular(
                            10,
                          ),
                        ),
                        padding:
                            const EdgeInsets
                                .symmetric(
                          vertical: 10,
                        ),
                      ),
                      child: const Text(
                        'Approve',
                        style:
                            TextStyle(
                          fontSize: 10,
                          fontWeight:
                              FontWeight
                                  .w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      width: double.infinity,
      padding:
          const EdgeInsets.symmetric(
        horizontal: 24,
        vertical: 40,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius:
            BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
        ),
      ),
      child: const Column(
        children: [
          Icon(
            Icons.fact_check_outlined,
            size: 44,
            color: Color(0xFF94A3B8),
          ),
          SizedBox(height: 12),
          Text(
            'No records found',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          SizedBox(height: 5),
          Text(
            'There are no records under this filter.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 10,
              color: secondaryTextColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomNavigationBar() {
    const labels = [
      'Home',
      'Approvals',
      'Analytics',
    ];

    const icons = [
      Icons.home_outlined,
      Icons.fact_check_outlined,
      Icons.bar_chart_outlined,
    ];

    return Container(
      height: 60,
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(
            color: Color(0xFFE2E8F0),
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 8,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: Padding(
        padding:
            const EdgeInsets.fromLTRB(
          10,
          5,
          10,
          5,
        ),
        child: Row(
          children: List.generate(
            labels.length,
            (index) {
              final isSelected =
                  index == 1;

              return Expanded(
                child: GestureDetector(
                  onTap: () {
                    selectNavigation(index);
                  },
                  child: AnimatedContainer(
                    duration:
                        const Duration(
                      milliseconds: 180,
                    ),
                    padding:
                        const EdgeInsets
                            .symmetric(
                      vertical: 6,
                    ),
                    decoration:
                        BoxDecoration(
                      color: isSelected
                          ? const Color(
                              0xFFEAF2FF,
                            )
                          : Colors.transparent,
                      borderRadius:
                          BorderRadius
                              .circular(
                        12,
                      ),
                    ),
                    child: Column(
                      mainAxisSize:
                          MainAxisSize.min,
                      children: [
                        Icon(
                          icons[index],
                          size: 19,
                          color: isSelected
                              ? primaryBlue
                              : secondaryTextColor,
                        ),
                        const SizedBox(
                          height: 2,
                        ),
                        Text(
                          labels[index],
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight:
                                isSelected
                                    ? FontWeight
                                        .w600
                                    : FontWeight
                                        .w500,
                            color: isSelected
                                ? primaryBlue
                                : secondaryTextColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}