# EduCheck

Grade record validation and consolidation system for elementary schools.
Teachers upload DepEd e-Class Records, EduCheck validates the grades, Class
Advisers consolidate and submit each learner's record, the School Administrator
approves it, and approved records feed the learner's SF10 (Permanent Record).

| Part | Stack | Folder |
|---|---|---|
| Backend API | Node.js, Express, PostgreSQL | `backend/` |
| Web app | React (Vite) | `frontend/` |
| Mobile app | Flutter (Android) | `mobile/` |

## Requirements

- Node.js 20 or newer
- PostgreSQL 15 or newer (`pg_dump` is used for backups)
- Flutter 3.29 or newer, only to build the mobile app

## 1. Database

Create an empty database and load the schema. The schema file alone is enough
for a fresh database; the `migrations/` folder is history only.

```
createdb -U postgres educheck_db
psql -U postgres -d educheck_db -f "02-Product Design/06-Database/SQL/educheck_schema.sql"
```

## 2. Backend

```
cd backend
npm install
copy .env.example .env
```

Edit `backend/.env`: set `DB_PASSWORD`, and set `JWT_SECRET` to a long random
string (the server refuses to start while it is `change-me`):

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

To email new accounts their temporary password, set `SMTP_USER` and
`SMTP_PASS` (a Gmail app password) in `backend/.env`; see `.env.example`.
Without them, accounts still work: the Administrator sees the temporary
password on screen and hands it over.

Create the first Administrator account (a fresh database has no users):

```
npm run create-admin -- admin.educheck admin@school.local ChangeMe2026
```

Start the API (port 5000):

```
npm start
```

Everything else (teachers, users, sections, subjects, assignments) is set up by
the Administrator in the web app.

## 3. Web app

```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

## Using EduCheck from other computers on the network (UAT)

Find the server PC's LAN address (`ipconfig`, e.g. `192.168.1.6`). Then:

1. `frontend/.env` (copy from `.env.example`):
   `VITE_API_URL=http://192.168.1.6:5000`, and optionally `VITE_SCHOOL_NAME`.
2. `backend/.env`: `CORS_ORIGIN=http://192.168.1.6:5173`
3. Restart the backend, then start the web app with `npm run dev -- --host`.
4. Other computers open `http://192.168.1.6:5173`.
5. If they cannot connect, allow ports 5000 and 5173 through Windows Firewall
   for private networks.

## Mobile app

Build from a copy of `mobile/` **outside OneDrive** (OneDrive locks the
`build` folder), then install the APK on the phone:

```
flutter pub get
flutter build apk --debug
```

The APK is at `build/app/outputs/flutter-apk/app-debug.apk`. On first launch,
set the server address to the backend's LAN address, e.g.
`http://192.168.1.6:5000`. The phone must be on the same network.

## Tests

```
cd backend && npm test      # 123 API tests on a separate educheck_test database
cd mobile && flutter test   # mobile unit tests
```

The backend tests create and drop their own `educheck_test` database, so the
database user needs permission to create databases. They never touch
`educheck_db`. Coverage: `03-Testing/EduCheck_Automated_Test_Coverage.md`.

## Backups

```
cd backend
npm run backup
```

Writes a `pg_dump` file to `%USERPROFILE%\EduCheck-db-backups` and keeps the
newest 14. To restore one into an empty database:

```
psql -U postgres -d educheck_db -f "C:\Users\<you>\EduCheck-db-backups\<file>.sql"
```

## Documents

| Folder | Contents |
|---|---|
| `01-Project Management/` | SPMP, role features |
| `02-Product Design/` | Database schema, UI/UX, backlogs, and the official DepEd source forms: SF10-ES and the blank e-Class Record (Grades 4-10, 3 terms) |
| `03-Testing/` | UAT test cases, known limitations, test coverage, UAT input files |
| `04-Development Evidence/` | Sprint screenshots |
| `05-Handoffs/` | Development hand-off notes, one per session |
