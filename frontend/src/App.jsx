import "./App.css";

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import Login from "./pages/auth/Login";
import ChangePassword from "./pages/auth/ChangePassword";
import Dashboard from "./pages/dashboards/Dashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import SubjectDashboard from "./pages/dashboards/SubjectDashboard";
import PrincipalDashboard from "./pages/dashboards/PrincipalDashboard";
import Accounts from "./pages/admin/Accounts";
import AccountApprovals from "./pages/admin/AccountApprovals";
import SectionAssignments from "./pages/sections/SectionAssignments";
import ClassRecordUpload from "./pages/records/ClassRecordUpload";
import ValidationResults from "./pages/records/ValidationResults";
import ConsolidatedRecords from "./pages/records/ConsolidatedRecords";
import SectionProgress from "./pages/sections/SectionProgress";
import Analytics from "./pages/dashboards/Analytics";
import AuditLog from "./pages/admin/AuditLog";
import RecordsRepository from "./pages/records/RecordsRepository";
import PermanentRecord from "./pages/records/PermanentRecord";
import Notifications from "./pages/account/Notifications";
import Settings from "./pages/account/Settings";
import ProtectedRoute from "./components/ProtectedRoute";
import { isSessionValid, getStoredUser, clearSession } from "./utils/session";


function RoleBasedDashboard() {
    // Same expired/invalid-session gap ProtectedRoute had — this route
    // bypassed ProtectedRoute entirely and did its own (weaker) check.
    if (!isSessionValid()) {
        clearSession();

        return <Navigate to="/" replace />;
    }

    const user = getStoredUser();

    if (user.must_change_password) {
        return <Navigate to="/change-password" replace />;
    }

    if (user.role === "admin") {
        return <AdminDashboard />;
    }

    if (user.role === "subject") {
        return <SubjectDashboard />;
    }

    if (user.role === "adviser") {
        return <Dashboard />;
    }

    if (user.role === "principal") {
        return <PrincipalDashboard />;
    }

    return <Navigate to="/" replace />;
}


function App() {
    return (
        <BrowserRouter>
            <Routes>

                <Route
                    path="/"
                    element={<Login />}
                />

                <Route
                    path="/change-password"
                    element={<ChangePassword />}
                />

                <Route
                    path="/dashboard"
                    element={<RoleBasedDashboard />}
                />

                <Route
                    path="/accounts"
                    element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                            <Accounts />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/account-approvals"
                    element={
                        <ProtectedRoute allowedRoles={["principal"]}>
                            <AccountApprovals />
                        </ProtectedRoute>
                    }
                />

                {/* User Management and Teacher Management were merged into Accounts. */}
                <Route path="/users" element={<Navigate to="/accounts" replace />} />
                <Route path="/teachers" element={<Navigate to="/accounts" replace />} />

                <Route
                    path="/section-assignments"
                    element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                            <SectionAssignments />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/class-record-upload"
                    element={
                        <ProtectedRoute allowedRoles={["subject", "adviser"]}>
                            <ClassRecordUpload />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/validation-results/:classRecordId"
                    element={
                        <ProtectedRoute allowedRoles={["subject", "adviser"]}>
                            <ValidationResults />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/consolidated-records"
                    element={
                        <ProtectedRoute allowedRoles={["adviser", "admin", "principal"]}>
                            <ConsolidatedRecords />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/section-progress"
                    element={
                        <ProtectedRoute allowedRoles={["adviser", "admin", "principal"]}>
                            <SectionProgress />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/analytics"
                    element={
                        <ProtectedRoute allowedRoles={["adviser", "admin", "principal"]}>
                            <Analytics />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/audit-log"
                    element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                            <AuditLog />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/records-repository"
                    element={
                        <ProtectedRoute allowedRoles={["adviser", "admin", "principal"]}>
                            <RecordsRepository />
                        </ProtectedRoute>
                    }
                />

                {/* The SF10 search was the Repository search under a second
                    menu item; SF10 is now opened from each Repository result. */}
                <Route
                    path="/permanent-record"
                    element={<Navigate to="/records-repository" replace />}
                />

                <Route
                    path="/permanent-record/:lrn"
                    element={
                        <ProtectedRoute allowedRoles={["adviser", "admin", "principal"]}>
                            <PermanentRecord />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/notifications"
                    element={
                        <ProtectedRoute allowedRoles={["adviser", "admin", "subject", "principal"]}>
                            <Notifications />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute allowedRoles={["adviser", "admin", "subject", "principal"]}>
                            <Settings />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;