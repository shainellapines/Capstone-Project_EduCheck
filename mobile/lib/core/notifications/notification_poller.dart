import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api/educheck_api.dart';
import '../session/session_store.dart';

/// SPMP M-02 (alerts for validation results, revision requests and
/// approval/rejection). Without a Firebase project the app polls
/// /api/notifications while it is open and raises a local phone
/// notification for anything new since the last check. Unread count is
/// exposed for the bell badge on every dashboard.
class NotificationPoller {
  NotificationPoller._();

  static final NotificationPoller instance = NotificationPoller._();

  static const Duration interval = Duration(seconds: 30);
  static const _lastSeenKey = 'educheck_last_notification_id';
  static const _alertsEnabledKey = 'educheck_alerts_enabled';

  final ValueNotifier<int> unreadCount = ValueNotifier<int>(0);
  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();

  Timer? _timer;
  bool _pluginReady = false;

  Future<void> init() async {
    if (kIsWeb || _pluginReady) return;
    try {
      await _plugin.initialize(
        settings: const InitializationSettings(
          android: AndroidInitializationSettings('@mipmap/ic_launcher'),
          iOS: DarwinInitializationSettings(),
        ),
      );
      await _plugin
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.requestNotificationsPermission();
      _pluginReady = true;
    } catch (_) {
      // Desktop/test environments without a notification backend: the
      // in-app bell still works.
    }
  }

  Future<bool> alertsEnabled() async =>
      (await SharedPreferences.getInstance()).getBool(_alertsEnabledKey) ?? true;

  Future<void> setAlertsEnabled(bool enabled) async =>
      (await SharedPreferences.getInstance()).setBool(_alertsEnabledKey, enabled);

  void start() {
    stop();
    _poll();
    _timer = Timer.periodic(interval, (_) => _poll());
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
  }

  Future<void> refresh() => _poll();

  Future<void> _poll() async {
    if (!SessionStore.instance.isLoggedIn) return;
    try {
      final result = await EduCheckApi.instance.notifications();
      final items = asList(result.data['notifications']);
      unreadCount.value = (result.data['unread_count'] as num?)?.toInt() ?? 0;
      if (result.fromCache || items.isEmpty) return;

      final prefs = await SharedPreferences.getInstance();
      final key = '$_lastSeenKey:${SessionStore.instance.user?['user_id']}';
      final lastSeen = prefs.getInt(key);
      final newestId = items.map((n) => (n['notification_id'] as num).toInt()).reduce((a, b) => a > b ? a : b);

      // First run on this device: remember where we are, don't replay history.
      if (lastSeen != null) {
        final fresh = items
            .where((n) => (n['notification_id'] as num).toInt() > lastSeen && n['status'] == 'Unread')
            .toList()
            .reversed;
        if (await alertsEnabled()) {
          for (final item in fresh) {
            await _show(item);
          }
        }
      }
      await prefs.setInt(key, newestId);
    } catch (_) {
      // Offline or server down - try again next tick.
    }
  }

  Future<void> _show(Json item) async {
    if (!_pluginReady) return;
    await _plugin.show(
      id: (item['notification_id'] as num).toInt(),
      title: item['title'] as String? ?? 'EduCheck',
      body: item['message'] as String? ?? '',
      notificationDetails: const NotificationDetails(
        android: AndroidNotificationDetails(
          'educheck_updates',
          'EduCheck updates',
          channelDescription: 'Validation results, revision requests and approval decisions',
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      ),
    );
  }
}
