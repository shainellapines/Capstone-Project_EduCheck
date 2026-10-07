import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class CachedEntry {
  CachedEntry(this.data, this.savedAt);

  final dynamic data;
  final DateTime savedAt;
}

/// SPMP M-10 (Offline Status Caching): the last successful response for
/// each GET is kept on the device, so statuses and notifications stay
/// viewable without a connection and refresh once it returns. Read-only by
/// design - actions (approve, submit, revision requests) always need the
/// server and are never queued.
class OfflineCache {
  OfflineCache._();

  static final OfflineCache instance = OfflineCache._();

  static const _prefix = 'educheck_cache:';

  Future<void> write(String key, dynamic data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      '$_prefix$key',
      jsonEncode({'saved_at': DateTime.now().toIso8601String(), 'data': data}),
    );
  }

  Future<CachedEntry?> read(String key) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('$_prefix$key');
    if (raw == null) return null;
    try {
      final decoded = jsonDecode(raw) as Map<String, dynamic>;
      return CachedEntry(decoded['data'], DateTime.parse(decoded['saved_at'] as String));
    } catch (_) {
      return null;
    }
  }

  /// Called on logout so one user's cached records never show for another.
  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    for (final key in prefs.getKeys().where((k) => k.startsWith(_prefix)).toList()) {
      await prefs.remove(key);
    }
  }
}
