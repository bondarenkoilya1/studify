import { type SidebarItem } from "../../shared/ui/navigation/Sidebar.tsx";
import markerPurple from "../../assets/shared/02_marker_purple_heading.png";
import dotsPurple from "../../assets/shared/07_dots_purple.png";
import dotsBlue from "../../assets/shared/08_dots_blue.png";
import dotsGreen from "../../assets/shared/09_dots_green.png";
import dotsYellow from "../../assets/shared/11_dots_yellow.png";
import iconOpenTasks from "../../assets/tasks/12_icon_open_tasks_blue.png";
import iconInProgress from "../../assets/tasks/13_icon_in_progress_yellow.png";
import iconCompleted from "../../assets/tasks/14_icon_completed_green.png";
import iconTaskName from "../../assets/tasks/15_icon_task_name_purple.png";
import iconSubject from "../../assets/tasks/16_icon_subject_blue.png";
import iconDeadline from "../../assets/tasks/17_icon_deadline_green.png";
import iconStatus from "../../assets/tasks/18_icon_status_yellow.png";
import sidebarDashboard from "../../assets/tasks/20_sidebar_dashboard.png";
import sidebarSubjects from "../../assets/tasks/21_sidebar_subjects.png";
import sidebarTasks from "../../assets/tasks/22_sidebar_tasks_active.png";
import sidebarCalendar from "../../assets/tasks/23_sidebar_calendar.png";
import sidebarNotes from "../../assets/tasks/24_sidebar_notes.png";
import sidebarProgress from "../../assets/tasks/25_sidebar_progress.png";
import sidebarSettings from "../../assets/tasks/26_sidebar_settings.png";
import heroTasks from "../../assets/tasks/28_hero_tasks_clipboard_plant.png";
import emptyInbox from "../../assets/tasks/29_empty_state_tasks_inbox.png";
import tableHeaderBg from "../../assets/tasks/30_table_header_soft_bg.png";
import formStrip from "../../assets/tasks/31_form_soft_background_strip.png";
import sparkleButton from "../../assets/tasks/32_button_purple_sparkle.png";
import dashedAddArea from "../../assets/tasks/33_dashed_add_task_area.png";
import avatarLogan from "../../assets/tasks/34_avatar_placeholder_logan.png";
import raysPurple from "../../assets/tasks/39_rays_purple.png";
import chevronDown from "../../assets/tasks/42_chevron_down.png";
import calendarInputIcon from "../../assets/tasks/43_calendar_input_icon.png";

export const taskAssets = {
  avatarLogan,
  calendarInputIcon,
  chevronDown,
  dashedAddArea,
  dotsBlue,
  dotsGreen,
  dotsPurple,
  dotsYellow,
  emptyInbox,
  formStrip,
  heroTasks,
  iconCompleted,
  iconDeadline,
  iconInProgress,
  iconOpenTasks,
  iconStatus,
  iconSubject,
  iconTaskName,
  markerPurple,
  raysPurple,
  sparkleButton,
  tableHeaderBg,
};

export const taskSidebarItems: SidebarItem[] = [
  { label: "Dashboard", icon: sidebarDashboard, to: "/dashboard" },
  { label: "Subjects", icon: sidebarSubjects, to: "/subjects" },
  { label: "Tasks", icon: sidebarTasks, to: "/tasks", active: true },
  { label: "Calendar", icon: sidebarCalendar, to: "/tasks" },
  { label: "Notes", icon: sidebarNotes, to: "/subjects" },
  { label: "Progress", icon: sidebarProgress, to: "/dashboard" },
  { label: "Settings", icon: sidebarSettings, to: "/dashboard" },
];
