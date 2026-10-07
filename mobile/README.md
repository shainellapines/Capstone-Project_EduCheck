# EduCheck Mobile

Flutter companion app for EduCheck (SPMP §6.5). It uses the same accounts, JWT login
and backend API as the web platform. Uploading e-Class Records, encoding grades,
configuring rules and generating the SF10 file stay on the web app; the mobile app
shows statuses and handles lightweight decisions.

## Running it

1. Start the backend (`cd backend && npm run dev`). It must listen on port 5000.
2. Get packages: `flutter pub get`.
3. Run:
   - **Android emulator:** `flutter run`. The app reaches your PC at `http://10.0.2.2:5000` by default.
   - **Real phone:** connect the phone to the same Wi-Fi as the PC. On the login screen tap
     **Server address** and enter `http://<your-PC-IP>:5000` (find the IP with `ipconfig`).
     Windows Firewall must allow inbound connections to Node on port 5000.
   - **Browser (quick check):** `flutter run -d chrome`. Uses `http://localhost:5000`.
   - To bake in a different server: `flutter run --dart-define=API_BASE_URL=http://192.168.1.10:5000`.
4. Log in with any EduCheck web account. The dashboard follows the account's role.

Checks: `flutter analyze` and `flutter test`.

## Features (SPMP M-01 to M-10)

| ID | Feature | Where | Notes |
|---|---|---|---|
| M-01 | Secure login | `screens/auth/login_screen.dart`, `core/session/` | Backend JWT; session restored on reopen; expired token returns to login |
| M-02 | Alerts | `core/notifications/notification_poller.dart` | Polls `/api/notifications` every 30 s while the app is open and raises a phone notification for new items. No Firebase, so no alerts while the app is closed |
| M-03 | Submission status | `shared/student_list_screen.dart`, `shared/overview_home.dart`, Subject Teacher "My Uploads" | Statuses are the backend's real ones (Not Submitted, Pending Approval, Approved, Rejected, Amendment Requested; Validated, Needs Attention, Needs Revision per subject) |
| M-04 | Validation error summary | `subject/upload_detail_screen.dart` | Read-only; fixes are re-uploaded on the web |
| M-05 | SF10 preview | `shared/sf10_preview_screen.dart` | Adviser, Admin, Principal. Readiness and Grade 1-6 years; the .xlsx is generated on the web |
| M-06 | Approve / return | `shared/student_record_screen.dart` | **Administrator only.** The Principal is view-only (SPMP §6.2 and the backend) |
| M-07 | Analytics snapshot | `shared/analytics_screen.dart` | Completion by section, outstanding subjects, grade summary, intervention list |
| M-08 | Repository lookup | `shared/repository_screen.dart` | Advisers only see their own learners (backend rule) |
| M-09 | Notification history | `shared/notification_screen.dart` | Last 50, unread filter, mark read |
| M-10 | Offline status caching | `core/cache/offline_cache.dart`, `core/api/api_client.dart` | Every screen shows the last synced data with an "Offline" banner; actions need a connection and are never queued |

The Adviser can also submit a record for approval and return one subject to its teacher
(same rules as the web app).

## Structure

```
lib/
  core/        api client + endpoints, session, offline cache, notification polling, shared widgets
  screens/
    auth/      login
    shared/    screens used by several roles (records, SF10, analytics, repository, notifications, profile)
    admin/ adviser/ principal/ subject/   one dashboard per role (tabs built from shared screens)
```
