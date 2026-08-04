export interface Subject {
  id: number;
  userId: number;
  name: string;
  lecturer: string;
  lecturerAvatarUrl?: string;
  examDate: string;
}

export interface SubjectInput {
  name: string;
  lecturer: string;
  lecturerAvatarUrl?: string;
  examDate: string;
}
