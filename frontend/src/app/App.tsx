import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardPage } from "../pages/dashboard/DashboardPage.tsx";
import { HomePage } from "../pages/home/HomePage.tsx";
import { SubjectsPage } from "../pages/subjects/SubjectsPage.tsx";
import { TasksPage } from "../pages/tasks/TasksPage.tsx";
import { SiteHeader } from "../widgets/site-header/SiteHeader.tsx";

export function App() {
  return (
    <>
      <SiteHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
