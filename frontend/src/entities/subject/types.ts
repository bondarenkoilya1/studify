export type Subject = {
  id: number;
  name: string;
  lecturer: string;
  exam_date: Date | null;
};

export type CreateSubjectPayload = Omit<Subject, "id">;
export type UpdateSubjectPayload = Partial<CreateSubjectPayload>;
