import { useEffect, useState } from "react";
import { getSubject } from "@/entities/subject/api/get-subject";
import type { Subject } from "@/entities/subject";

type ReturnType = Subject | null;

export function useGetSubject(id: number): ReturnType {
  const [subject, setSubject] = useState<ReturnType>(null);

  useEffect(() => {
    const fetchSubject = async () => {
      const s = await getSubject(id);
      setSubject(s);
    };

    fetchSubject();
  }, [id]);

  return subject;
}
