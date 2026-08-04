export interface Subject {
  id: number;
  userId: number;
  name: string;
  lecturer: string;
  lecturerAvatarUrl?: string;
  examDate: string;
}

export type SubjectInput = {
  name: string;
  lecturer: string;
  lecturerAvatarUrl?: string;
  examDate: string;
};
