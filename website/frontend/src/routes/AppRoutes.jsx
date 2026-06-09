import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import SignupPage from '../pages/auth/SignupPage';
import DashboardPage from '../pages/DashboardPage';
import ProjectsPage from '../pages/ProjectsPage';
import NewProjectPage from '../pages/NewProjectPage';
import ProjectSuccessPage from '../pages/ProjectSuccessPage';
import ProjectDetailsPage from '../pages/ProjectDetailsPage';
import EngineerMilestoneInputPage from '../pages/EngineerMilestoneInputPage';
import EngineerMilestoneReviewPage from '../pages/EngineerMilestoneReviewPage';
import EngineerMilestoneSuccessPage from '../pages/EngineerMilestoneSuccessPage';
import ProjectApprovalPage from '../pages/ProjectApprovalPage';
import TasksPage from '../pages/TasksPage';
import ReportsPage from '../pages/ReportsPage';
import ProfilePage from '../pages/ProfilePage';
import UserManagementPage from '../pages/admin/UserManagementPage';
import useAuth from '../hooks/useAuth';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-primary">
                <p className="text-text-muted text-sm">Loading...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function RootRedirect() {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const hash = window.location.hash || sessionStorage.getItem('supabase_recovery_hash');

    if (code) {
        return <Navigate to={`/reset-password${window.location.search}`} replace />;
    }

    if (hash && (hash.includes('type=recovery') || hash.includes('type=invite'))) {
        sessionStorage.removeItem('supabase_recovery_hash');
        return <Navigate to={`/reset-password${hash.startsWith('#') ? hash : '#' + hash}`} replace />;
    }
    
    return <Navigate to="/login" replace />;
}

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/signup" element={<Navigate to="/login" replace />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="/projects"              element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
                <Route path="/projects/new"           element={<ProtectedRoute><NewProjectPage /></ProtectedRoute>} />
                <Route path="/projects/success"       element={<ProtectedRoute><ProjectSuccessPage /></ProtectedRoute>} />
                <Route path="/projects/:id"           element={<ProtectedRoute><ProjectDetailsPage /></ProtectedRoute>} />
                <Route path="/projects/:id/milestone-input"   element={<ProtectedRoute><EngineerMilestoneInputPage /></ProtectedRoute>} />
                <Route path="/projects/:id/milestone-review"  element={<ProtectedRoute><EngineerMilestoneReviewPage /></ProtectedRoute>} />
                <Route path="/projects/:id/milestone-success" element={<ProtectedRoute><EngineerMilestoneSuccessPage /></ProtectedRoute>} />
                <Route path="/projects/:id/approval"  element={<ProtectedRoute><ProjectApprovalPage /></ProtectedRoute>} />
                <Route path="/tasks"                  element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
                <Route path="/reports"                element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
                <Route path="/personnel"              element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>} />
                <Route path="/profile"                element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            </Routes>
        </BrowserRouter>
    );
}
