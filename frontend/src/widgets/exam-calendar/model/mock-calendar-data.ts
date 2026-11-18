import type { Subject, Task } from "@/shared/api";

function toLocalIso(date: Date, hour: number, minute = 0) {
  const result = new Date(date);
  result.setHours(hour, minute, 0, 0);
  return result.toISOString();
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  return result;
}

export function getMockSubjects(): Subject[] {
  const week = startOfWeek(new Date());
  const date = (offset: number, hour = 9) => {
    const result = new Date(week);
    result.setDate(result.getDate() + offset);
    return toLocalIso(result, hour);
  };

  return [
    {
      id: -101,
      user_id: -1,
      name: "Высшая математика",
      note: "Экзамен",
      type: "university",
      scope: "science",
      exam_type: "exam",
      exam_date: date(1),
      course: 2,
      term: 3,
      thumbnail_url: null,
      lecturers: null,
      files: null,
    },
    {
      id: -102,
      user_id: -1,
      name: "Базы данных",
      note: "Практический зачёт",
      type: "university",
      scope: "technology",
      exam_type: "credit",
      exam_date: date(3),
      course: 2,
      term: 3,
      thumbnail_url: null,
      lecturers: null,
      files: null,
    },
    {
      id: -103,
      user_id: -1,
      name: "История России",
      note: null,
      type: "university",
      scope: "humanities",
      exam_type: "exam",
      exam_date: date(8),
      course: 2,
      term: 3,
      thumbnail_url: null,
      lecturers: null,
      files: null,
    },
    {
      id: -104,
      user_id: -1,
      name: "Английский язык",
      note: null,
      type: "university",
      scope: "humanities",
      exam_type: "coursework",
      exam_date: date(5),
      course: 2,
      term: 3,
      thumbnail_url: null,
      lecturers: null,
      files: null,
    },
  ];
}

export function getMockTasks(): Task[] {
  const week = startOfWeek(new Date());
  const at = (offset: number, hour: number, minute = 0) => {
    const result = new Date(week);
    result.setDate(result.getDate() + offset);
    return toLocalIso(result, hour, minute);
  };
  const base = {
    description: "",
    status: "not_completed" as const,
    difficulty: "medium" as const,
    priority: "medium" as const,
    created_at: at(0, 8),
    updated_at: at(0, 8),
  };

  return [
    {
      ...base,
      id: -201,
      subject_id: -101,
      name: "Повторить интегралы",
      type: "exam",
      estimated_time: 90,
      scheduled_at: at(1, 10),
      deadline: at(1, 12),
    },
    {
      ...base,
      id: -202,
      subject_id: -102,
      name: "Практика по SQL",
      type: "credit",
      estimated_time: 120,
      scheduled_at: at(2, 13),
      deadline: at(2, 15),
    },
    {
      ...base,
      id: -203,
      subject_id: -103,
      name: "Конспект лекций",
      type: "exam",
      estimated_time: 60,
      scheduled_at: at(3, 9, 30),
      deadline: at(3, 10, 30),
    },
    {
      ...base,
      id: -204,
      subject_id: -104,
      name: "Подготовить доклад",
      type: "coursework",
      estimated_time: 90,
      scheduled_at: at(4, 15),
      deadline: at(4, 16, 30),
    },
    {
      ...base,
      id: -205,
      subject_id: -101,
      name: "Решить вариант №3",
      type: "exam",
      estimated_time: 120,
      scheduled_at: at(5, 11),
      deadline: at(5, 13),
    },
  ];
}
