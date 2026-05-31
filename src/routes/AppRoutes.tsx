import { Navigate, Route, Routes } from "react-router-dom";
import { isLocalDevBypass } from "@/lib/dev-mode";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import StudentsPage from "@/pages/StudentsPage";
import StudentProfilePage from "@/pages/StudentProfilePage";
import InterestedPage from "@/pages/InterestedPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { AppShell } from "@/components/layout/AppShell";

/** On localhost dev, skip login and land on dashboard with mock data. */
function HomeRedirect() {
  const target = isLocalDevBypass() ? "/uni/dashboard" : "/uni/login";
  return <Navigate to={target} replace />;
}

function LoginRoute() {
  if (isLocalDevBypass()) {
    return <Navigate to="/uni/dashboard" replace />;
  }
  return <LoginPage />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/uni/login" element={<LoginRoute />} />
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
