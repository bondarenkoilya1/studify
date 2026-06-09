import { type SidebarItem } from "../../shared/ui/navigation/Sidebar.tsx";
import markerPurple from "../../assets/shared/02_marker_purple_heading.png";
import dotsPurple from "../../assets/shared/07_dots_purple.png";
import dotsBlue from "../../assets/shared/08_dots_blue.png";
import dotsGreen from "../../assets/shared/09_dots_green.png";
import iconSubjects from "../../assets/subjects/12_icon_subjects_purple.png";
import iconTasks from "../../assets/subjects/13_icon_tasks_blue.png";
import iconDeadline from "../../assets/subjects/14_icon_deadline_yellow.png";
import iconLecturer from "../../assets/subjects/15_icon_lecturer_blue.png";
import iconExam from "../../assets/subjects/16_icon_exam_green.png";
import iconFlask from "../../assets/subjects/17_icon_subject_flask_purple.png";
import iconSparkle from "../../assets/subjects/18_icon_create_sparkle_blue.png";
import sidebarDashboard from "../../assets/subjects/21_subjects_sidebar_dashboard.png";
import sidebarSubjects from "../../assets/subjects/22_sidebar_subjects_active.png";
import sidebarTasks from "../../assets/subjects/23_subjects_sidebar_tasks.png";
import sidebarCalendar from "../../assets/subjects/24_subjects_sidebar_calendar.png";
import sidebarNotes from "../../assets/subjects/25_sidebar_notes.png";
import sidebarProgress from "../../assets/subjects/26_sidebar_progress.png";
import sidebarSettings from "../../assets/subjects/27_sidebar_settings.png";
import heroSubjects from "../../assets/subjects/28_hero_subjects_notebook_plant.png";
import subjectHeaderAccent from "../../assets/subjects/29_subject_card_header_purple_accent.png";
import formStrip from "../../assets/subjects/30_form_soft_background_strip.png";
import avatarLogan from "../../assets/shared/32_avatar_placeholder_logan.png";
import tinyName from "../../assets/subjects/33_tiny_name_icon.png";
import tinyLecturer from "../../assets/subjects/34_tiny_lecturer_icon.png";
import tinyExam from "../../assets/subjects/35_tiny_exam_icon.png";
import raysPurple from "../../assets/subjects/37_rays_purple.png";
import chevronDown from "../../assets/subjects/40_chevron_down.png";

export const subjectAssets = {
  avatarLogan,
  chevronDown,
  dotsBlue,
  dotsGreen,
  dotsPurple,
  formStrip,
  heroSubjects,
  iconDeadline,
  iconExam,
  iconFlask,
  iconLecturer,
  iconSparkle,
  iconSubjects,
  iconTasks,
  markerPurple,
  raysPurple,
  subjectHeaderAccent,
  tinyExam,
  tinyLecturer,
  tinyName,
};

export const subjectSidebarItems: SidebarItem[] = [
  { label: "Dashboard", icon: sidebarDashboard, to: "/dashboard" },
  { label: "Subjects", icon: sidebarSubjects, to: "/subjects", active: true },
  { label: "Tasks", icon: sidebarTasks, to: "/tasks" },
  { label: "Calendar", icon: sidebarCalendar, to: "/tasks" },
  { label: "Notes", icon: sidebarNotes, to: "/subjects" },
  { label: "Progress", icon: sidebarProgress, to: "/dashboard" },
  { label: "Settings", icon: sidebarSettings, to: "/dashboard" },
];
