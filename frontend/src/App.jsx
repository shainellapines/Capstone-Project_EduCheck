import "./App.css";

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SubjectDashboard from "./pages/SubjectDashboard";
import PrincipalDashboard from "./pages/PrincipalDashboard";
import UserManagement from "./pages/UserManagement";
import TeacherManagement from "./pages/TeacherManagement";
import SectionAssignments from "./pages/SectionAssignments";
import ClassRecordUpload from "./pages/ClassRecordUpload";
import ValidationResults from "./pages/ValidationResults";
import ConsolidatedRecords from "./pages/ConsolidatedRecords";
import SectionProgress from "./pages/SectionProgress";
import Analytics from "./pages/Analytics";
import RecordsRepository from "./pages/RecordsRepository";
import Notifications from "./pages/Notifications";
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
                    path="/dashboard"
                    element={<RoleBasedDashboard />}
                />

                <Route
                    path="/users"
                    element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                            <UserManagement />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/teachers"
                    element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                            <TeacherManagement />
                        </ProtectedRoute>
                    }
                />

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
                        <ProtectedRoute allowedRoles={["subject"]}>
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
                    path="/records-repository"
                    element={
                        <ProtectedRoute allowedRoles={["adviser", "admin", "principal"]}>
                            <RecordsRepository />
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
                    path="*"
                    element={<Navigate to="/" replace />}
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;