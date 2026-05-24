export type Subject = {
  id: number;
  name: string;
  lecturer: string;
  exam_date: string;
};

export type CreateSubjectPayload = Omit<Subject, "id">;
