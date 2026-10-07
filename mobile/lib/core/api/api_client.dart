import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../cache/offline_cache.dart';
import '../session/session_store.dart';

/// Thrown for any non-2xx response or network failure. [statusCode] is null
/// when the server could not be reached at all.
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  bool get isNetworkError => statusCode == null;

  @override
  String toString() => message;
}

/// A GET result plus whether it came from the offline cache (SPMP M-10).
class ApiResult<T> {
  ApiResult(this.data, {this.fromCache = false, this.cachedAt});

  final T data;
  final bool fromCache;
  final DateTime? cachedAt;
}

/// Thin JSON client for the EduCheck backend. Every request carries the
/// JWT from [SessionStore]; a 401 clears the session so the app returns to
/// the login screen (same rule as the web app's fetch interceptor).
class ApiClient {
  ApiClient._();

  static final ApiClient instance = ApiClient._();

  static const Duration _timeout = Duration(seconds: 15);

  /// Called when the backend rejects the token; app.dart routes to login.
  void Function()? onUnauthorized;

  Uri _uri(String path) => Uri.parse('${SessionStore.instance.baseUrl}/api$path');

  Map<String, String> get _headers {
    final token = SessionStore.instance.token;
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  dynamic _decode(http.Response response) {
    dynamic body;
    try {
      body = response.body.isEmpty ? null : jsonDecode(response.body);
    } catch (_) {
      body = null;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) return body;

    if (response.statusCode == 401 && SessionStore.instance.token != null) {
      SessionStore.instance.clear();
      onUnauthorized?.call();
    }

    final message = body is Map && body['message'] is String
        ? body['message'] as String
        : 'Request failed (${response.statusCode}).';
    throw ApiException(message, statusCode: response.statusCode);
  }

  Future<dynamic> _send(Future<http.Response> Function() request) async {
    try {
      return _decode(await request().timeout(_timeout));
    } on ApiException {
      rethrow;
    } on TimeoutException {
      throw ApiException('The server took too long to respond. Check your connection.');
    } catch (_) {
      throw ApiException(
        'Cannot reach the EduCheck server at ${SessionStore.instance.baseUrl}. '
        'Check your connection or the server address.',
      );
    }
  }

  /// GET with offline fallback: a successful response is cached; when the
  /// server is unreachable the last cached copy is returned instead.
  Future<ApiResult<dynamic>> get(String path) async {
    final cacheKey = '${SessionStore.instance.user?['user_id']}:$path';
    try {
      final data = await _send(() => http.get(_uri(path), headers: _headers));
      await OfflineCache.instance.write(cacheKey, data);
      return ApiResult(data);
    } on ApiException catch (error) {
      if (!error.isNetworkError) rethrow;
      final cached = await OfflineCache.instance.read(cacheKey);
      if (cached == null) rethrow;
      return ApiResult(cached.data, fromCache: true, cachedAt: cached.savedAt);
    }
  }

  Future<dynamic> post(String path, [Map<String, dynamic>? body]) =>
      _send(() => http.post(_uri(path), headers: _headers, body: jsonEncode(body ?? {})));

  Future<dynamic> put(String path, Map<String, dynamic> body) =>
      _send(() => http.put(_uri(path), headers: _headers, body: jsonEncode(body)));
}
