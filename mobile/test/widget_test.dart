import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/app.dart';
import 'package:mobile/core/session/session_store.dart';
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

    await tester.tap(find.text('Server address'));
    await tester.pump();

    expect(find.byType(TextField), findsNWidgets(3));
  });

  test('status colours: approved is green, rejected is red', () {
    expect(StatusStyle.of('Approved').foreground, const Color(0xFF16A34A));
    expect(StatusStyle.of('Rejected').foreground, const Color(0xFFDC2626));
    expect(StatusStyle.of('Something else').foreground, const Color(0xFF64748B));
  });

  test('grades format without needless decimals', () {
    expect(formatGrade(87), '87');
    expect(formatGrade(87.5), '87.50');
    expect(formatGrade(null), '-');
  });
}
