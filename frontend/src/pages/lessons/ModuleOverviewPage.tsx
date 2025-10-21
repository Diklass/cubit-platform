// src/pages/SubjectPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { SubjectSidebar } from "../../components/lessons/SubjectSidebar";
import { useAuth } from "../../auth/AuthContext";
import { ModuleOverview } from "../../components/lessons/ModuleOverview";
import api from "../../api";
import { useNavigate } from "react-router-dom";

export default function SubjectPage() {
  const { subjectId } = useParams();
  const [sp, setSp] = useSearchParams();
  const selectedLessonId = sp.get("lessonId") ?? undefined;

  const { user } = useAuth();
  const role = user?.role ?? "GUEST";

  const [modules, setModules] = useState([]);
  const navigate = useNavigate();

const loadModules = async () => {
  if (!subjectId) return;
  const { data } = await api.get(`/subjects/${subjectId}`);
  setModules(data.tree || []); // 🔹 должно быть [], а не data.tree[0]
};

  useEffect(() => {
    loadModules();
  }, [subjectId]);

  // Когда удаляется модуль или урок
  const handleDataChange = () => {
    loadModules();
  };

const handleSelectLesson = (lessonId: string) => {
  navigate(`/lessons/view/${lessonId}`);
};

  return (
    <div className="flex h-full">
      <SubjectSidebar
        subjectId={subjectId}
        modules={modules}
        currentLessonId={selectedLessonId}
        currentRole={role}
        onSelectLesson={handleSelectLesson}
        onDataChange={handleDataChange} // 🟦 добавили общий хук
      />
      <div className="flex-1 overflow-auto">
        <ModuleOverview
          modules={modules}
          onDataChange={handleDataChange} // 🟦 передаём тот же хук
          role={role}
        />
      </div>
    </div>
  );
}
