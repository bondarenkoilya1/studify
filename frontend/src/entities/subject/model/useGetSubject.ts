import { useEffect, useState } from "react";
import { getSubject } from "@/entities/subject/api/get-subject";
import type { Subject } from "@/entities/subject";

export function useGetSubject(id: number): Subject | null {
  const [subject, setSubject] = useState<Subject | null>(null);

  useEffect(() => {
    const fetchSubject = async () => {
      const s = await getSubject(id);
      setSubject(s);
    };

    fetchSubject();
  }, [id]);

  return subject;
}
