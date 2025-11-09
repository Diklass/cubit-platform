import React, { useEffect, useState } from "react";
import { TestEditor } from "./TestEditor";
import { getQuiz, createQuiz as apiCreateQuiz } from "../../api/quiz";

type Props = { lessonId: string };

export function QuizBlock({ lessonId }: Props) {
  const [quiz, setQuiz] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getQuiz(lessonId);
      setQuiz(data ?? null);
    } catch (e: any) {
      console.error("loadQuiz error:", e?.response || e);
      setQuiz(null);
      setError(e?.response?.status === 404 ? null : "Не удалось загрузить тест");
    } finally {
      setLoading(false);
    }
  }

  // локальный патч квиза без полной перезагрузки
  function patchQuiz(mutator: (draft: any) => void) {
    setQuiz((prev: any) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      mutator(next);
      return next;
    });
  }

  useEffect(() => {
    if (lessonId) refresh();
  }, [lessonId]);

  async function createQuiz() {
    try {
      const { data } = await apiCreateQuiz(lessonId, { title: "Новый тест" });
      setQuiz(data);
    } catch (e: any) {
      console.error("createQuiz error:", e?.response || e);
      setError("Не удалось создать тест");
    }
  }

  if (loading) return <p>Загрузка теста…</p>;
  if (error)   return <p style={{ color: "red" }}>{error}</p>;

  if (!quiz) {
    return (
      <div style={{ margin: "20px 0" }}>
        <button onClick={createQuiz}>Создать тест…</button>
      </div>
    );
  }

  return (
    <TestEditor
      lessonId={lessonId}
      quiz={quiz}
      onQuizPatch={patchQuiz}
      refresh={refresh}
    />
  );
}