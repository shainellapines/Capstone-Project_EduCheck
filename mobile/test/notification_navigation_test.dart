import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/core/session/session_store.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/screens/shared/notification_screen.dart';
import 'package:mobile/screens/shared/role_shell.dart';
import 'package:shared_preferences/shared_preferences.dart';

// SPMP M-06: an Administrator acts on a submitted record from its
// notification. Tapping the alert opens the tab that lists it.
void main() {
  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await SessionStore.instance.load();
  });

  http.Client fakeServer({required List<String> readRequests}) {
    var read = false;
    return MockClient((request) async {
      final path = request.url.path;
      if (request.method == 'POST' && path.endsWith('/notifications/1/read')) {
        read = true;
        readRequests.add(path);
        return http.Response('{}', 200);
      }
      if (path.endsWith('/notifications')) {
        return http.Response(
          jsonEncode({
            'unread_count': read ? 0 : 1,
            'notifications': [
              {
                'notification_id': 1,
                'title': NotificationTitles.recordSubmitted,
                'message': "Ana Adviser submitted Cruz, Juan's consolidated record (Grade 6 – Rizal) for approval.",
                'status': read ? 'Read' : 'Unread',
                'created_at': '2026-10-10T08:00:00Z',
              },
            ],
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      }
      return http.Response('{}', 404);
    });
  }

  testWidgets('tapping a submission alert marks it read and opens the Approvals tab', (tester) async {
    final readRequests = <String>[];
    final client = fakeServer(readRequests: readRequests);

    await http.runWithClient(() async {
      await tester.pumpWidget(MaterialApp(
        theme: AppTheme.lightTheme,
        home: RoleShell(
          subtitle: 'Administrator',
          tabs: [
            ShellTab(label: 'Home', icon: Icons.home_rounded, builder: (context, goTo) => const Text('home tab')),
            ShellTab(
              label: 'Approvals',
              icon: Icons.fact_check_outlined,
              builder: (context, goTo) => const Text('approvals tab'),
              opensFor: const {NotificationTitles.recordSubmitted},
            ),
          ],
        ),
      ));
      expect(find.text('home tab'), findsOneWidget);

      await tester.tap(find.byTooltip('Notifications'));
      await tester.pumpAndSettle();
      expect(find.text(NotificationTitles.recordSubmitted), findsOneWidget);
      expect(find.byIcon(Icons.chevron_right_rounded), findsOneWidget, reason: 'openable alerts show a chevron');

      await tester.tap(find.text(NotificationTitles.recordSubmitted));
      await tester.pumpAndSettle();

      expect(readRequests, hasLength(1), reason: 'the alert is marked read');
      expect(find.text('approvals tab'), findsOneWidget);
      expect(tester.widget<NavigationBar>(find.byType(NavigationBar)).selectedIndex, 1);
    }, () => client);
  });
}
