import '../cache/offline_cache.dart';
import '../session/session_store.dart';
import 'api_client.dart';

typedef Json = Map<String, dynamic>;

List<Json> asList(dynamic value) =>
    value is List ? value.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList() : <Json>[];

Json asMap(dynamic value) => value is Map ? Map<String, dynamic>.from(value) : <String, dynamic>{};

/// Every backend call the mobile app makes, in one place. The mobile app is
/// a companion to the web platform (SPMP §6.5): it reads statuses and takes
/// lightweight decisions, but never uploads, encodes or edits grades.
class EduCheckApi {
  EduCheckApi._();

  static final EduCheckApi instance = EduCheckApi._();

  final ApiClient _client = ApiClient.instance;

  String _id(Object value) => Uri.encodeComponent(value.toString());

  // ---------- auth (M-01) ----------

  Future<Json> login(String username, String password) async {
    final body = asMap(await _client.post('/auth/login', {'username': username, 'password': password}));
    final user = asMap(body['user']);
    if (!const {'admin', 'principal', 'adviser', 'subject'}.contains(user['role'])) {
      throw ApiException('This account role is not supported on mobile.');
    }
    await SessionStore.instance.save(body['token'] as String, user);
    return user;
  }

  Future<void> logout() async {
    await SessionStore.instance.clear();
    await OfflineCache.instance.clear();
  }

  Future<ApiResult<Json>> me() async {
    final result = await _client.get('/auth/me');
    final body = asMap(result.data);
    // `profile` is the teacher profile (name, employee no., contact), or
    // null for Admin/Principal accounts, which have none.
    final user = {...asMap(body['user']), 'profile': body['profile']};
    return ApiResult(user, fromCache: result.fromCache, cachedAt: result.cachedAt);
  }

  Future<void> changePassword(String current, String next) =>
      _client.post('/auth/change-password', {'current_password': current, 'new_password': next});

  Future<ApiResult<List<Json>>> myAssignments() async {
    final result = await _client.get('/assignments/mine');
    return ApiResult(asList(result.data), fromCache: result.fromCache, cachedAt: result.cachedAt);
  }

  // ---------- school years ----------

  /// The newest Active school year (falls back to the newest of any status).
  Future<ApiResult<Json?>> currentSchoolYear() async {
    final path = SessionStore.instance.role == 'subject' ? '/uploads/options' : '/consolidation/school-years';
    final result = await _client.get(path);
    final years = asList(asMap(result.data)['school_years']);
    final active = years.where((year) => year['status'] == 'Active').toList();
    final chosen = active.isNotEmpty ? active.first : (years.isNotEmpty ? years.first : null);
    return ApiResult(chosen, fromCache: result.fromCache, cachedAt: result.cachedAt);
  }

  // ---------- consolidation / submissions (M-03, M-06) ----------

  Future<ApiResult<Json>> consolidatedRecords(int schoolYearId, {int? sectionId}) async {
    final query = sectionId == null ? '' : '?section_id=$sectionId';
    final result = await _client.get('/consolidation/school-years/$schoolYearId$query');
    return ApiResult(asMap(result.data), fromCache: result.fromCache, cachedAt: result.cachedAt);
  }

  Future<ApiResult<Json>> studentRecord(int schoolYearId, String lrn) async {
    final result = await _client.get('/consolidation/school-years/$schoolYearId/students/${_id(lrn)}');
    return ApiResult(asMap(asMap(result.data)['student']), fromCache: result.fromCache, cachedAt: result.cachedAt);
  }

  Future<ApiResult<List<Json>>> sectionProgress(int schoolYearId) async {
    final result = await _client.get('/consolidation/school-years/$schoolYearId/sections');
    return ApiResult(asList(asMap(result.data)['sections']), fromCache: result.fromCache, cachedAt: result.cachedAt);
  }

  Future<Json> requestRevision(int classRecordId, String remarks) async =>
      asMap(await _client.post('/consolidation/class-records/$classRecordId/request-revision', {'remarks': remarks}));

  Future<Json> submitForApproval(int schoolYearId, String lrn) async =>
      asMap(await _client.post('/submissions/school-years/$schoolYearId/students/${_id(lrn)}/submit'));

  Future<Json> submitAllEligible(int schoolYearId) async =>
      asMap(await _client.post('/submissions/school-years/$schoolYearId/submit-all'));

  Future<Json> approve(int schoolYearId, String lrn, {String? remarks}) async => asMap(await _client
      .post('/submissions/school-years/$schoolYearId/students/${_id(lrn)}/approve', {'remarks': remarks}));

  Future<Json> reject(int schoolYearId, String lrn, String remarks) async => asMap(await _client
      .post('/submissions/school-years/$schoolYearId/students/${_id(lrn)}/reject', {'remarks': remarks}));

  // ---------- subject teacher uploads (M-03, M-04) ----------

  Future<ApiResult<Json>> myUploadSummary() async {
    final result = await _client.get('/uploads/my-records/summary');
    return ApiResult(asMap(result.data), fromCache: result.fromCache, cachedAt: result.cachedAt);
  }

  Future<ApiResult<List<Json>>> myUploads() async {
    final result = await _client.get('/uploads/my-records');
    return ApiResult(asList(asMap(result.data)['records']), fromCache: result.fromCache, cachedAt: result.cachedAt);
  }

  Future<ApiResult<Json>> uploadValidation(int classRecordId) async {
    final result = await _client.get('/uploads/my-records/$classRecordId/validation');
    return ApiResult(asMap(result.data), fromCache: result.fromCache, cachedAt: result.cachedAt);
  }

  // ---------- analytics (M-07) ----------

  Future<ApiResult<Json>> analytics(int schoolYearId) async {
    final result = await _client.get('/analytics/school-years/$schoolYearId');
    return ApiResult(asMap(result.data), fromCache: result.fromCache, cachedAt: result.cachedAt);
  }

  // ---------- repository + SF10 (M-05, M-08) ----------

  Future<ApiResult<Json>> searchRepository(String query) async {
    final result = await _client.get('/repository/search?q=${Uri.encodeQueryComponent(query)}');
    return ApiResult(asMap(result.data), fromCache: result.fromCache, cachedAt: result.cachedAt);
  }

  Future<ApiResult<Json>> sf10Preview(String lrn) async {
    final result = await _client.get('/sf10/students/${_id(lrn)}');
    return ApiResult(asMap(result.data), fromCache: result.fromCache, cachedAt: result.cachedAt);
  }

  // ---------- notifications (M-02, M-09) ----------

  Future<ApiResult<Json>> notifications() async {
    final result = await _client.get('/notifications');
    return ApiResult(asMap(result.data), fromCache: result.fromCache, cachedAt: result.cachedAt);
  }

  Future<void> markNotificationRead(int id) => _client.post('/notifications/$id/read');

  Future<void> markAllNotificationsRead() => _client.post('/notifications/read-all');
}
