import { Navigate, Route, Routes } from "react-router-dom";
import { isLocalDevBypass } from "@/lib/dev-mode";
import { useAuthContext } from "@/context/AuthContext";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import StudentsPage from "@/pages/StudentsPage";
import StudentProfilePage from "@/pages/StudentProfilePage";
import InterestedPage from "@/pages/InterestedPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { AppShell } from "@/components/layout/AppShell";
import { OpsShell } from "@/components/layout/OpsShell";
import OpsTodayPage from "@/pages/ops/OpsTodayPage";
import OpsLibraryPage from "@/pages/ops/OpsLibraryPage";
import OpsUniversitiesPage from "@/pages/ops/OpsUniversitiesPage";
import OpsUniversityDetailPage from "@/pages/ops/OpsUniversityDetailPage";
import OpsOffersPage from "@/pages/ops/OpsOffersPage";
import OpsProgramsPage from "@/pages/ops/OpsProgramsPage";

function HomeRedirect() {
  const { loading, roleLoading, isAdmin, mode, user } = useAuthContext();

  if (loading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (isAdmin) return <Navigate to="/ops" replace />;
  if (mode === "partner") return <Navigate to="/uni/dashboard" replace />;

  // Partner marketplace can still use local mock; ops requires real admin login
  if (isLocalDevBypass() && !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/login" replace />;
}

function LoginRoute() {
  // Always allow the login page so admins can authenticate for RLS-backed /ops data
  return <LoginPage />;
}

/** Legacy partner login URL */
function UniLoginRedirect() {
  return <Navigate to="/login" replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/uni/login" element={<UniLoginRedirect />} />

      {/* Sallam admin — University Operations */}
      <Route path="/ops" element={<OpsShell />}>
        <Route index element={<OpsTodayPage />} />
        <Route path="library" element={<OpsLibraryPage />} />
        <Route path="universities" element={<OpsUniversitiesPage />} />
        <Route path="universities/:id" element={<OpsUniversityDetailPage />} />
        <Route path="offers" element={<OpsOffersPage />} />
        <Route path="programs" element={<OpsProgramsPage />} />
      </Route>

      {/* University partner marketplace (unchanged) */}
      <Route path="/uni" element={<AppShell />}>
        <Route index element={<Navigate to="/uni/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/:id" element={<StudentProfilePage />} />
        <Route path="interested" element={<InterestedPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
