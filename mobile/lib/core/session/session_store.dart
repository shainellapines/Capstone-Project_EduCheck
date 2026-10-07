import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Holds the logged-in user's JWT and profile, persisted so the app
/// reopens straight to the dashboard (SPMP M-01: same account and JWT as
/// the web platform, no separate registration).
class SessionStore {
  SessionStore._();

  static final SessionStore instance = SessionStore._();

  static const _tokenKey = 'educheck_token';
  static const _userKey = 'educheck_user';
  static const _serverKey = 'educheck_server';

  /// Android emulators reach the host PC at 10.0.2.2; web/desktop builds use
  /// localhost. A physical phone needs the PC's LAN address, set on the
  /// login screen. `--dart-define=API_BASE_URL=...` overrides the default.
  static String get defaultBaseUrl {
    const fromDefine = String.fromEnvironment('API_BASE_URL');
    if (fromDefine.isNotEmpty) return fromDefine;
    if (kIsWeb) return 'http://localhost:5000';
    return defaultTargetPlatform == TargetPlatform.android
        ? 'http://10.0.2.2:5000'
        : 'http://localhost:5000';
  }

  SharedPreferences? _prefs;
  String? token;
  Map<String, dynamic>? user;
  String baseUrl = defaultBaseUrl;

  String? get role => user?['role'] as String?;
  bool get isLoggedIn => token != null && user != null && !_isExpired(token!);

  Future<void> load() async {
    _prefs = await SharedPreferences.getInstance();
    token = _prefs!.getString(_tokenKey);
    final rawUser = _prefs!.getString(_userKey);
    user = rawUser == null ? null : jsonDecode(rawUser) as Map<String, dynamic>;
    baseUrl = _prefs!.getString(_serverKey) ?? defaultBaseUrl;

    if (token != null && _isExpired(token!)) await clear();
  }

  Future<void> save(String newToken, Map<String, dynamic> newUser) async {
    token = newToken;
    user = newUser;
    await _prefs?.setString(_tokenKey, newToken);
    await _prefs?.setString(_userKey, jsonEncode(newUser));
  }

  Future<void> setBaseUrl(String url) async {
    baseUrl = url.trim().replaceAll(RegExp(r'/+$'), '');
    await _prefs?.setString(_serverKey, baseUrl);
  }

  Future<void> clear() async {
    token = null;
    user = null;
    await _prefs?.remove(_tokenKey);
    await _prefs?.remove(_userKey);
  }

  /// Reads the JWT's exp claim (no signature check - the backend does that).
  static bool _isExpired(String jwt) {
    try {
      final parts = jwt.split('.');
      if (parts.length != 3) return true;
      final payload = jsonDecode(utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))));
      final exp = payload['exp'];
      if (exp is! int) return false;
      return DateTime.now().millisecondsSinceEpoch >= exp * 1000;
    } catch (_) {
      return true;
    }
  }
}
