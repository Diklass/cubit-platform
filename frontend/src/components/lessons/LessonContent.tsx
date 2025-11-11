import React, { useEffect, useState } from "react";
import api from "../../api";
import {
  Box,
  Typography,
  Button,
  useTheme,
  Divider,
} from "@mui/material";
import DOMPurify from "dompurify";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { TestRunner } from "../quiz/TestRunner";

type Block = { type: string; content: string };
type Lesson = { id: string; title: string; content: string | null };

interface Props {
  lessonId?: string;
}

export const LessonContent: React.FC<Props> = ({ lessonId }) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [quiz, setQuiz] = useState<any | null>(null);   // ✅ перенесли сюда
  const theme = useTheme();

  // Загрузка урока
  useEffect(() => {
    if (!lessonId) return;
    api.get<Lesson>(`/subjects/lessons/${lessonId}`).then((r) => setLesson(r.data));
  }, [lessonId]);

  // ✅ всегда стоит над любыми return!
  useEffect(() => {
    if (!lessonId) return;

    api.get(`/lessons/${lessonId}/quiz/public`)
      .then((r) => setQuiz(r.data))
      .catch(() => setQuiz(null));
  }, [lessonId]);

  // ✅ После всех хуков — проверки
  if (!lessonId) return <Typography>Выберите урок</Typography>;
  if (!lesson) return <Typography>Загрузка...</Typography>;

  let sections: any[] = [];
  try {
    const parsed = lesson.content ? JSON.parse(lesson.content) : [];
    sections = Array.isArray(parsed) ? parsed : [];
  } catch {
    sections = [];
  }



  const exportToPDF = async () => {
    if (!lesson) return;
    const element = document.getElementById("lesson-content");
    if (!element) return;

    const clone = element.cloneNode(true) as HTMLElement;
    clone.id = "lesson-print-clone";
    Object.assign(clone.style, {
      background: "white",
      color: "black",
      padding: "24px",
      width: "210mm",
      boxSizing: "border-box",
      fontFamily: "Arial, sans-serif",
    });
    clone.querySelectorAll("*").forEach((el) => {
      (el as HTMLElement).style.background = "transparent";
      (el as HTMLElement).style.color = "black";
    });
    document.body.appendChild(clone);

    const canvas = await html2canvas(clone, { scale: 2, useCORS: true, backgroundColor: "#fff" });
    clone.remove();

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgData = canvas.toDataURL("image/png");
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = 0;
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);

    if (imgHeight > pageHeight) {
      let remainingHeight = imgHeight - pageHeight;
      while (remainingHeight > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        remainingHeight -= pageHeight;
      }
    }
    pdf.save(`${lesson.title || "Урок"}.pdf`);
  };

   return (
    <Box sx={{ p: "0px" }}>
      {/* УДАЛЯЕМ старую кнопку над карточкой */}

       <Box
         id="lesson-content"
          sx={{

    borderRadius: 0,
    backgroundColor: "transparent",
    color: theme.palette.text.primary,
    boxShadow: "none",
    transition: "color 0.3s",
    position: "relative",

    "& img": {
      borderRadius: 12,
      maxWidth: "100%",
      height: "auto",
      display: "block",
      margin: "12px 0",
    },
  }}
>
        {/* ✅ Кнопка в правом верхнем углу */}
        <Button
          variant="contained"
          size="small"
          onClick={exportToPDF}
          sx={{
            position: "absolute",
            top: 5,
            right: 5,
            borderRadius: "12px",
            textTransform: "none",
            boxShadow: theme.shadows[2],
            "&:hover": { boxShadow: theme.shadows[4] },
          }}
        >
          📄 Экспорт
        </Button>

        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            mb: "20px",
            pr: "96px", // ✅ запас справа под кнопку
            color: theme.palette.text.primary,
          }}
        >
          {lesson.title}
        </Typography>

        {sections.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Нет содержимого
          </Typography>
        )}

        {sections.map((section, sIdx) => (
          <Box key={sIdx} sx={{ mb: "20px" }}>
            <Typography
              variant="h6"
              sx={{
                mb: "10px",
                pb: "4px",
                borderBottom: `1px solid ${theme.palette.divider}`,
                color: theme.palette.text.primary,
              }}
            >
              {section.title}
            </Typography>

            {section.children.map((b: any, idx: number) => (
              <Box key={idx} sx={{ mb: "20px" }}>
                {b.type === "text" && (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(b.content),
                    }}
                  />
                )}
                {b.type === "image" && b.content && (
                  <img
                    src={b.content}
                    alt="Изображение"
                    style={{
                      maxWidth: "100%",
                      borderRadius: 12,
                      margin: "12px 0",
                      // boxShadow: theme.shadows[2], // ⬅️ удалить эту строку
                    }}
                  />
                )}
                {b.type === "video" && (
                  <Typography color="text.secondary">Видео: {b.content}</Typography>
                )}
                {b.type === "file" && b.content && (
                  <a
                    href={b.content}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: theme.palette.primary.main,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "color .15s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.target as HTMLElement).style.color =
                        theme.palette.primary.dark)
                    }
                    onMouseLeave={(e) =>
                      ((e.target as HTMLElement).style.color =
                        theme.palette.primary.main)
                    }
                  >
                    📎 {decodeURIComponent(b.content.split("/").pop() || "Файл")}
                  </a>
                )}
              </Box>
            ))}
            {sIdx !== sections.length - 1 && <Divider sx={{ my: "20px" }} />}
          </Box>
        ))}

        {quiz && (
  <Box sx={{ mt: 4, p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
    <Typography variant="h5" sx={{ mb: 2 }}>
      Тест: {quiz.title}
    </Typography>

    <TestRunner quiz={quiz} lessonId={lessonId} />
  </Box>
)}
      </Box>
    </Box>
  );
};
