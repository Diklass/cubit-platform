// src/pages/SubjectPage.tsx
import React, { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { LessonContent } from "../components/LessonContent";
import { SubjectSidebar } from "../components/SubjectSidebar";
import { useAuth } from "../auth/AuthContext"; // ✅ добавляем импорт

export default function SubjectPage() {
  const { subjectId } = useParams();
  const [sp, setSp] = useSearchParams();
  const selectedLessonId = sp.get("lessonId") ?? undefined;

  const { user } = useAuth(); // ✅ получаем пользователя
  const role = user?.role ?? "GUEST"; // если не авторизован

  const handleSelectLesson = (lessonId: string) => {
    sp.set("lessonId", lessonId);
    setSp(sp, { replace: true });
  };

  return (
    <div className="flex h-full">
      <SubjectSidebar
        subjectId={subjectId}
        currentLessonId={selectedLessonId}
        currentRole={role} // ✅ теперь передаём настоящую роль
        onSelectLesson={handleSelectLesson}
      />
      <div className="flex-1 overflow-auto">
        <LessonContent lessonId={selectedLessonId} />
      </div>
    </div>
  );
}
