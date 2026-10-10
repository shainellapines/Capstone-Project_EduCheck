import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/app.dart';
import 'package:mobile/core/session/session_store.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/core/widgets/ui.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await SessionStore.instance.load();
  });

  testWidgets('shows the login screen when nobody is signed in', (tester) async {
    await tester.pumpWidget(const EduCheckApp());

    expect(find.text('EduCheck'), findsOneWidget);
    expect(find.text('Username'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);
    expect(find.text('Log In'), findsOneWidget);
  });

  testWidgets('asks for both fields before contacting the server', (tester) async {
    await tester.pumpWidget(const EduCheckApp());

    await tester.tap(find.text('Log In'));
    await tester.pump();

    expect(find.text('Please enter your username and password.'), findsOneWidget);
  });

  testWidgets('server address field is hidden until requested', (tester) async {
    await tester.pumpWidget(const EduCheckApp());
    expect(find.text('http://192.168.1.10:5000'), findsNothing);

    // The login screen scrolls; on the short test surface the link sits
    // below the logo and card, so scroll to it as a user would.
    await tester.ensureVisible(find.text('Server address'));
    await tester.tap(find.text('Server address'));
    await tester.pump();

    expect(find.byType(TextField), findsNWidgets(3));
  });

  // Same mapping as the web StatusBadge: Approved is a solid green badge,
  // Pending Approval solid blue, Needs Revision lemon yellow, Rejected red.
  test('status colours follow the design system', () {
    expect(StatusStyle.of('Approved').background, AppTheme.success);
    expect(StatusStyle.of('Approved').foreground, AppTheme.onStatusSolid);
    expect(StatusStyle.of('Pending Approval').background, AppTheme.infoSolid);
    expect(StatusStyle.of('Needs Revision').foreground, AppTheme.revision);
    expect(StatusStyle.of('Rejected').foreground, AppTheme.danger);
    expect(StatusStyle.of('Something else').foreground, AppTheme.neutral);
  });

  // Same words as the web StatusBadge; stored values are unchanged.
  test('status labels match the web', () {
    expect(statusLabel(null), 'Pending');
    expect(statusLabel('Not Submitted'), 'Pending');
    expect(statusLabel('Pending Approval'), 'Submitted');
    expect(statusLabel('Rejected'), 'Returned by Administrator');
    expect(statusLabel('Validated'), 'Uploaded');
    expect(statusLabel('Needs Attention'), 'Needs Revision');
    expect(statusLabel('Approved'), 'Approved');
    expect(statusLabel('Amendment Requested'), 'Amendment Requested');
    expect(statusLabel('Partial'), 'Partial');
  });

  test('grades format without needless decimals', () {
    expect(formatGrade(87), '87');
    expect(formatGrade(87.5), '87.50');
    expect(formatGrade(null), '-');
  });
}
