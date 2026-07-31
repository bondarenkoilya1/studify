export interface Subject {
  id: number;
  userId: number;
  name: string;
  lecturer: string;
  lecturer_avatar_url: string;
  exam_date: string;
}

export type SubjectInput = Omit<Subject, "id" | "userId">;
