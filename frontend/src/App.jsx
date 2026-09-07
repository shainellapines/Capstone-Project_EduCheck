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
import UserManagement from "./pages/UserManagement";
import TeacherManagement from "./pages/TeacherManagement";
import ClassRecordUpload from "./pages/ClassRecordUpload";
import ValidationResults from "./pages/ValidationResults";
import ConsolidatedRecords from "./pages/ConsolidatedRecords";
import RecordsRepository from "./pages/RecordsRepository";
import Notifications from "./pages/Notifications";
import ProtectedRoute from "./components/ProtectedRoute";


function RoleBasedDashboard() {
    const userData = localStorage.getItem("educheck_user");

    if (!userData) {
        return <Navigate to="/" replace />;
    }

    const user = JSON.parse(userData);

    if (user.role === "admin") {
        return <AdminDashboard />;
    }

    if (user.role === "subject") {
        return <SubjectDashboard />;
    }

    if (user.role === "adviser") {
        return <Dashboard />;
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
                    path="/class-record-upload"
                    element={
                        <ProtectedRoute allowedRoles={["subject"]}>
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
                        <ProtectedRoute allowedRoles={["adviser", "admin"]}>
                            <ConsolidatedRecords />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/records-repository"
                    element={
                        <ProtectedRoute allowedRoles={["adviser", "admin"]}>
                            <RecordsRepository />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/notifications"
                    element={
                        <ProtectedRoute allowedRoles={["adviser", "admin", "subject"]}>
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