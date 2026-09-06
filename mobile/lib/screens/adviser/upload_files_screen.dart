import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

class UploadFilesScreen extends StatefulWidget {
  const UploadFilesScreen({super.key});

  @override
  State<UploadFilesScreen> createState() => _UploadFilesScreenState();
}

class _UploadFilesScreenState extends State<UploadFilesScreen> {
  String selectedGrade = 'Grade 6';
  String selectedSection = 'Sampaguita';
  String selectedQuarter = '2nd Quarter';
  String selectedSchoolYear = '2025-2026';

  final Map<String, String?> selectedFiles = {
    'Filipino': null,
    'English': null,
    'Mathematics': null,
    'Science': null,
    'Araling Panlipunan': null,
    'MAPEH': null,
    'Edukasyon sa Pagpapakatao': null,
    'Technology and Livelihood Education': null,
  };

  final List<String> grades = [
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5',
    'Grade 6',
  ];

  final List<String> sections = [
    'Sampaguita',
    'Rosal',
    'Gumamela',
    'Dama de Noche',
    'Santan',
  ];

  final List<String> quarters = [
    '1st Quarter',
    '2nd Quarter',
    '3rd Quarter',
    '4th Quarter',
  ];

  final List<String> schoolYears = [
    '2024-2025',
    '2025-2026',
    '2026-2027',
    '2027-2028',
    '2028-2029',
  ];

  Future<void> pickFile(String subject) async {
    final result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['xlsx', 'xls'],
      allowMultiple: false,
    );

    if (result != null && result.files.isNotEmpty) {
      setState(() {
        selectedFiles[subject] = result.files.first.name;
      });
    }
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
            color: Color(0xFF344054),
          ),
        ),
        const SizedBox(height: 7),
        DropdownButtonFormField<String>(
          value: value,
          decoration: InputDecoration(
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 13,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: Color(0xFFD0D5DD),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: Color(0xFFD0D5DD),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: Color(0xFF1554D1),
                width: 1.5,
              ),
            ),
            filled: true,
            fillColor: Colors.white,
          ),
          items: items.map((item) {
            return DropdownMenuItem<String>(
              value: item,
              child: Text(
                item,
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF344054),
                ),
              ),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget buildSubjectUpload(String subject) {
    final fileName = selectedFiles[subject];

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(
          color: const Color(0xFFD0D5DD),
        ),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            subject,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Color(0xFF344054),
            ),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: () => pickFile(subject),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(double.infinity, 44),
              side: const BorderSide(
                color: Color(0xFFD0D5DD),
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(7),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  fileName == null
                      ? Icons.cloud_upload_outlined
                      : Icons.check_circle_outline,
                  size: 19,
                  color: fileName == null
                      ? const Color(0xFF475467)
                      : const Color(0xFF16A34A),
                ),
                const SizedBox(width: 7),
                Flexible(
                  child: Text(
                    fileName ?? 'Choose File',
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: fileName == null
                          ? FontWeight.w500
                          : FontWeight.w600,
                      color: fileName == null
                          ? const Color(0xFF475467)
                          : const Color(0xFF16A34A),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget buildUploadGrid() {
    final subjects = selectedFiles.keys.toList();

    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth >= 700;

        if (isWide) {
          return GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: subjects.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 14,
              mainAxisSpacing: 14,
              childAspectRatio: 3.8,
            ),
            itemBuilder: (context, index) {
              return buildSubjectUpload(subjects[index]);
            },
          );
        }

        return Column(
          children: subjects.map((subject) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: buildSubjectUpload(subject),
            );
          }).toList(),
        );
      },
    );
  }

  Widget buildPageHeader() {
    return Container(
      height: 56,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      color: const Color(0xFF1554D1),
      child: const Row(
        children: [
          Icon(
            Icons.cloud_upload_outlined,
            color: Colors.white,
            size: 24,
          ),
          SizedBox(width: 10),
          Text(
            'Upload Files',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Widget buildWelcomeSection() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
      color: Colors.white,
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Welcome, Maria Santos',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: Color(0xFF101828),
            ),
          ),
          SizedBox(height: 6),
          Text(
            'Adviser (Homeroom Teacher) • Class: Grade 6 - Sampaguita',
            style: TextStyle(
              fontSize: 14,
              color: Color(0xFF667085),
            ),
          ),
          SizedBox(height: 4),
          Text(
            'School Year: 2025-2026',
            style: TextStyle(
              fontSize: 13,
              color: Color(0xFF667085),
            ),
          ),
        ],
      ),
    );
  }

  Widget buildUploadCard() {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 4, 20, 24),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFFD0D5DD),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
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
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: const Color(0xFFEAF2FF),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.cloud_upload_outlined,
                  color: Color(0xFF1554D1),
                  size: 25,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Upload Multiple Subject Files',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF101828),
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Upload Excel files for each subject and consolidate into unified student records',
                      style: TextStyle(
                        fontSize: 13,
                        color: Color(0xFF667085),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Divider(
            color: Color(0xFFE4E7EC),
          ),
          const SizedBox(height: 18),
          const Text(
            'Record Information',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Color(0xFF101828),
            ),
          ),
          const SizedBox(height: 14),
          LayoutBuilder(
            builder: (context, constraints) {
              final isWide = constraints.maxWidth >= 700;

              if (isWide) {
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: buildDropdown(
                        label: 'Grade Level',
                        value: selectedGrade,
                        items: grades,
                        onChanged: (value) {
                          if (value != null) {
                            setState(() {
                              selectedGrade = value;
                            });
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: buildDropdown(
                        label: 'Section',
                        value: selectedSection,
                        items: sections,
                        onChanged: (value) {
                          if (value != null) {
                            setState(() {
                              selectedSection = value;
                            });
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: buildDropdown(
                        label: 'Quarter',
                        value: selectedQuarter,
                        items: quarters,
                        onChanged: (value) {
                          if (value != null) {
                            setState(() {
                              selectedQuarter = value;
                            });
                          }
                        },
                      ),
                    ),
                  ],
                );
              }

              return Column(
                children: [
                  buildDropdown(
                    label: 'Grade Level',
                    value: selectedGrade,
                    items: grades,
                    onChanged: (value) {
                      if (value != null) {
                        setState(() {
                          selectedGrade = value;
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 14),
                  buildDropdown(
                    label: 'Section',
                    value: selectedSection,
                    items: sections,
                    onChanged: (value) {
                      if (value != null) {
                        setState(() {
                          selectedSection = value;
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 14),
                  buildDropdown(
                    label: 'Quarter',
                    value: selectedQuarter,
                    items: quarters,
                    onChanged: (value) {
                      if (value != null) {
                        setState(() {
                          selectedQuarter = value;
                        });
                      }
                    },
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: 14),
          buildDropdown(
            label: 'School Year',
            value: selectedSchoolYear,
            items: schoolYears,
            onChanged: (value) {
              if (value != null) {
                setState(() {
                  selectedSchoolYear = value;
                });
              }
            },
          ),
          const SizedBox(height: 20),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              border: Border.all(
                color: const Color(0xFFD0D5DD),
              ),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.info_outline,
                  color: Color(0xFF344054),
                  size: 22,
                ),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Multi-File Upload Instructions',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF101828),
                        ),
                      ),
                      SizedBox(height: 8),
                      Text(
                        'Upload separate Excel files for each subject (Math, English, Science, etc.).',
                        style: TextStyle(
                          fontSize: 13,
                          color: Color(0xFF667085),
                        ),
                      ),
                      SizedBox(height: 5),
                      Text(
                        'Students will be automatically matched using LRN (primary) or name matching (fallback).',
                        style: TextStyle(
                          fontSize: 13,
                          color: Color(0xFF667085),
                        ),
                      ),
                      SizedBox(height: 5),
                      Text(
                        'All grades must be 60-100 per DepEd grading policy.',
                        style: TextStyle(
                          fontSize: 13,
                          color: Color(0xFF667085),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          const Text(
            'Upload Subject Files',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Color(0xFF101828),
            ),
          ),
          const SizedBox(height: 14),
          buildUploadGrid(),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
              onPressed: selectedFiles.values.any((file) => file != null)
                  ? () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text(
                            'Files uploaded successfully. Validation will be available next.',
                          ),
                        ),
                      );
                    }
                  : null,
              icon: const Icon(Icons.cloud_upload_outlined),
              label: const Text(
                'Upload and Consolidate Files',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1554D1),
                foregroundColor: Colors.white,
                disabledBackgroundColor: const Color(0xFFE4E7EC),
                disabledForegroundColor: const Color(0xFF98A2B3),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        buildPageHeader(),
        Expanded(
          child: SingleChildScrollView(
            child: Column(
              children: [
                buildWelcomeSection(),
                buildUploadCard(),
              ],
            ),
          ),
        ),
      ],
    );
  }
}