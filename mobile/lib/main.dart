import 'package:flutter/material.dart';

import 'app.dart';
import 'core/notifications/notification_poller.dart';
import 'core/session/session_store.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SessionStore.instance.load();
  await NotificationPoller.instance.init();
  runApp(const EduCheckApp());
}
