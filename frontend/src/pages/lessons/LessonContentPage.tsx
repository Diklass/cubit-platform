// src/pages/LessonContentWrapper.tsx
import React from "react";
import { useParams } from "react-router-dom";
import { LessonContent } from "../../components/lessons/LessonContent";

export default function LessonContentWrapper() {
  const { lessonId } = useParams<{ lessonId: string }>();
  return <LessonContent lessonId={lessonId} />;
}
