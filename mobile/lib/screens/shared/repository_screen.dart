import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/api/educheck_api.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/ui.dart';
import 'sf10_preview_screen.dart';
import 'student_record_screen.dart';

/// SPMP M-08 (Digital Repository Lookup): find a learner by LRN or name
/// across every school year, then open a year's record or the SF10
/// preview. The backend limits Advisers to their own learners.
class RepositoryScreen extends StatefulWidget {
  const RepositoryScreen({super.key});

  @override
  State<RepositoryScreen> createState() => _RepositoryScreenState();
}

class _RepositoryScreenState extends State<RepositoryScreen> {
  final TextEditingController _query = TextEditingController();
  ApiResult<Json>? _result;
  List<Json> _schoolYears = [];
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    final query = _query.text.trim();
    if (query.length < 2) {
      setState(() => _error = 'Type at least 2 characters of a name or LRN.');
      return;
    }
    FocusScope.of(context).unfocus();
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await EduCheckApi.instance.searchRepository(query);
      if (_schoolYears.isEmpty) {
        final years = await ApiClient.instance.get('/consolidation/school-years');
        _schoolYears = asList(asMap(years.data)['school_years']);
      }
      setState(() => _result = result);
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _yearLabel(dynamic id) =>
      _schoolYears.firstWhere((y) => y['school_year_id'] == id, orElse: () => {'school_year': '#$id'})['school_year'].toString();

  @override
  Widget build(BuildContext context) {
    final students = asList(_result?.data['students']);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        const Text(
          'Digital Repository',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.textDark),
        ),
        const SizedBox(height: 4),
        const Text(
          'Look up a learner\'s records by LRN or name.',
          style: TextStyle(fontSize: 12.5, color: AppTheme.textGray),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _query,
          textInputAction: TextInputAction.search,
          onSubmitted: (_) => _search(),
          decoration: InputDecoration(
            hintText: 'LRN or name (e.g. Dela Cruz)',
            prefixIcon: const Icon(Icons.search_rounded),
            suffixIcon: IconButton(onPressed: _search, icon: const Icon(Icons.arrow_forward_rounded)),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppTheme.border),
            ),
          ),
        ),
        const SizedBox(height: 14),
        if (_loading) const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator())),
        if (_error != null) Text(_error!, style: const TextStyle(color: AppTheme.danger, fontSize: 12.5)),
        if (_result?.fromCache == true) OfflineBanner(cachedAt: _result!.cachedAt),
        if (!_loading && _result != null && students.isEmpty)
          const EmptyState(icon: Icons.person_search_outlined, message: 'No learners matched that search.'),
        if (_result?.data['truncated'] == true)
          const Padding(
            padding: EdgeInsets.only(bottom: 8),
            child: Text(
              'Showing the first 50 matches - add more of the name or LRN to narrow it down.',
              style: TextStyle(fontSize: 11.5, color: AppTheme.warning),
            ),
          ),
        for (final student in students) ...[
          AppCard(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const IconTile(
                      icon: Icons.badge_outlined,
                      color: AppTheme.primary,
                      background: AppTheme.primaryTint,
                      size: 38,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${student['last_name']}, ${student['first_name']}',
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                          ),
                          Text(
                            'LRN ${student['lrn']} • Grade ${student['latest_grade_level']}',
                            style: const TextStyle(fontSize: 11.5, color: AppTheme.textGray),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ActionChip(
                      avatar: const Icon(Icons.description_outlined, size: 16),
                      label: const Text('SF10 preview'),
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => Sf10PreviewScreen(lrn: student['lrn'].toString())),
                      ),
                    ),
                    for (final year in asList(student['school_years']))
                      ActionChip(
                        label: Text('${_yearLabel(year['school_year_id'])} • Grade ${year['grade_level']}'),
                        onPressed: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => StudentRecordScreen(
                              schoolYearId: (year['school_year_id'] as num).toInt(),
                              lrn: student['lrn'].toString(),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
        ],
      ],
    );
  }
}

