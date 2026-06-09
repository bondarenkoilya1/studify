import { type SidebarItem } from "../../shared/ui/navigation/Sidebar.tsx";
import markerPurple from "../../assets/dashboard/02_dashboard_marker_purple_heading.png";
import markerGreen from "../../assets/dashboard/03_dashboard_marker_green_heading.png";
import dotsPurple from "../../assets/dashboard/07_dashboard_dots_purple.png";
import dotsBlue from "../../assets/dashboard/08_dashboard_dots_blue.png";
import dotsGreen from "../../assets/dashboard/09_dashboard_dots_green.png";
import dotsRed from "../../assets/dashboard/10_dashboard_dots_red.png";
import iconSubjects from "../../assets/dashboard/13_icon_subjects_purple.png";
import iconTasks from "../../assets/dashboard/14_icon_tasks_blue.png";
import iconCalendar from "../../assets/dashboard/15_icon_calendar_red.png";
import iconProgress from "../../assets/dashboard/16_icon_progress_green.png";
import iconOverdue from "../../assets/dashboard/17_icon_overdue_red.png";
import iconSuccess from "../../assets/dashboard/18_icon_success_green.png";
import sidebarDashboard from "../../assets/dashboard/21_sidebar_dashboard.png";
import sidebarSubjects from "../../assets/dashboard/22_sidebar_subjects.png";
import sidebarTasks from "../../assets/dashboard/23_sidebar_tasks.png";
import sidebarCalendar from "../../assets/dashboard/24_sidebar_calendar.png";
import sidebarProgress from "../../assets/dashboard/25_dashboard_sidebar_progress.png";
import sidebarSettings from "../../assets/dashboard/26_dashboard_sidebar_settings.png";
import deadlineEmpty from "../../assets/dashboard/27_empty_state_calendar_deadline.png";
import successEmpty from "../../assets/dashboard/28_empty_state_success_check.png";
import greenBlob from "../../assets/dashboard/29_accent_blob_green.png";
import pinkBlob from "../../assets/dashboard/30_accent_blob_pink.png";
import avatarLogan from "../../assets/shared/32_avatar_placeholder_logan.png";
import dotYellow from "../../assets/dashboard/33_status_dot_yellow.png";
import dotBlue from "../../assets/dashboard/34_status_dot_blue.png";
import chevronDown from "../../assets/dashboard/38_chevron_down.png";
import raysPurple from "../../assets/dashboard/39_dashboard_rays_purple.png";
import raysRed from "../../assets/dashboard/40_rays_red.png";

export const dashboardAssets = {
  avatarLogan,
  chevronDown,
  deadlineEmpty,
  dotBlue,
  dotYellow,
  dotsBlue,
  dotsGreen,
  dotsPurple,
  dotsRed,
  greenBlob,
  iconCalendar,
  iconOverdue,
  iconProgress,
  iconSubjects,
  iconSuccess,
  iconTasks,
  markerGreen,
  markerPurple,
  pinkBlob,
  raysPurple,
  raysRed,
  successEmpty,
};

export const dashboardSidebarItems: SidebarItem[] = [
  { label: "Dashboard", icon: sidebarDashboard, to: "/dashboard", active: true },
  { label: "Subjects", icon: sidebarSubjects, to: "/subjects" },
  { label: "Tasks", icon: sidebarTasks, to: "/tasks" },
  { label: "Calendar", icon: sidebarCalendar, to: "/tasks" },
  { label: "Notes", icon: iconTasks, to: "/subjects" },
  { label: "Progress", icon: sidebarProgress, to: "/dashboard" },
  { label: "Settings", icon: sidebarSettings, to: "/dashboard" },
];
