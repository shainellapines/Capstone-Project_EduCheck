import '../../core/api/api_client.dart';
import '../../core/api/educheck_api.dart';

/// The school year every dashboard works in: the newest Active one.
/// Fetched once per app session and reused by every tab.
class SchoolYearContext {
  SchoolYearContext._();

  static Json? _current;

  static Future<ApiResult<Json>> current() async {
    if (_current != null) return ApiResult(_current!);
    final result = await EduCheckApi.instance.currentSchoolYear();
    if (result.data == null) {
      throw ApiException('No school year has been set up yet. Ask the Administrator to create one.');
    }
    if (!result.fromCache) _current = result.data;
    return ApiResult(result.data!, fromCache: result.fromCache, cachedAt: result.cachedAt);
  }

  static int idOf(Json schoolYear) => (schoolYear['school_year_id'] as num).toInt();

  static void reset() => _current = null;
}
