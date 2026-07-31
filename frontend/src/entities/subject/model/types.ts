export interface Subject {
  id: number;
  user_id: number;
  name: string;
  lecturer: string;
  lecturer_avatar_url?: string;
  exam_date: string;
}

export type SubjectInput = {
  name: string;
  lecturer: string;
  lecturer_avatar_url?: string;
  exam_date: string;
};
