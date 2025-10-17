import React, { useEffect, useState } from 'react';
import api from '../api';
import { Box, Typography } from '@mui/material';
import DOMPurify from 'dompurify';

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@mui/material";

type Block = { type: string; content: string };
type Lesson = { id: string; title: string; content: string | null };

interface Props {
  lessonId?: string;
}

export const LessonContent: React.FC<Props> = ({ lessonId }) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    api.get<Lesson>(`/subjects/lessons/${lessonId}`).then((r) => setLesson(r.data));
  }, [lessonId]);

  if (!lessonId) {
    return <div>Выберите урок</div>;
  }

  if (!lesson) {
    return <div>Загрузка...</div>;
  }

  let sections: any[] = [];
  try {
    const parsed = lesson.content ? JSON.parse(lesson.content) : [];
    sections = Array.isArray(parsed) ? parsed : [];
  } catch {
    sections = [];
  }
  // Функция для видео
  const renderVideo = (url: string) => {
    if (!url) return null;

    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) {
      return (
        <iframe
          width="100%"
          height="315"
          src={`https://www.youtube.com/embed/${ytMatch[1]}`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ borderRadius: 8, margin: '12px 0' }}
        />
      );
    }

    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return (
        <iframe
          src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
          width="100%"
          height="315"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          style={{ borderRadius: 8, margin: '12px 0' }}
        />
      );
    }

    return (
      <a href={url} target="_blank" rel="noreferrer" style={{ color: '#1976d2' }}>
        ▶ Смотреть видео
      </a>
    );
  };

  // Функция для выбора иконки файла
  const renderFile = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase() || '';
    let icon = '📎';
    if (['pdf'].includes(ext)) icon = '📄';
    if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) icon = '📝';
    if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) icon = '📊';
    if (['ppt', 'pptx', 'odp'].includes(ext)) icon = '📑';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) icon = '📦';
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) icon = '🎵';
    if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) icon = '🎬';

    return (
      <a href={url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        {decodeURIComponent(url.split('/').pop() || 'Файл')}
      </a>
    );
  };

const exportToPDF = async () => {
  if (!lesson) return;

  const element = document.getElementById("lesson-content");
  if (!element) return;

  // === создаем клон ===
  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = "lesson-print-clone";
  clone.style.background = "white";
  clone.style.color = "black";
  clone.style.padding = "24px";
  clone.style.width = "210mm";
  clone.style.boxSizing = "border-box";
  clone.style.fontFamily = "Arial, sans-serif";

  // обрабатываем все вложенные элементы
  clone.querySelectorAll("*").forEach((el) => {
    (el as HTMLElement).style.background = "transparent";
    (el as HTMLElement).style.color = "black";
  });

  // добавляем клон в документ, но вне видимой области
  document.body.appendChild(clone);

  // создаем снимок с белым фоном
  const canvas = await html2canvas(clone, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  // удаляем временный клон
  clone.remove();

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let position = 0;
  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);

  if (imgHeight > pageHeight) {
    let remainingHeight = imgHeight - pageHeight;
    while (remainingHeight > 0) {
      position = position - pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      remainingHeight -= pageHeight;
    }
  }

  pdf.save(`${lesson.title || "Урок"}.pdf`);
};

  return (
  <Box sx={{ p: 2 }}>
    <Button
      variant="outlined"
      sx={{ mb: 2 }}
      onClick={exportToPDF}
    >
      📄 Экспорт в PDF
    </Button>

    <Box
      id="lesson-content"
      sx={(theme) => ({
        p: 2,
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        transition: "background-color 0.3s, color 0.3s",
      })}
    >
      <Typography variant="h5" sx={{ mb: 2 }}>
        {lesson.title}
      </Typography>

      {sections.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Нет содержимого
        </Typography>
      )}

      {sections.map((section, sIdx) => (
        <Box key={sIdx} sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              mb: 1,
              borderBottom: (theme) =>
                `1px solid ${theme.palette.divider}`,
              color: "text.primary",
            }}
          >
            {section.title}
          </Typography>

          {section.children.map((b: any, idx: number) => (
            <Box key={idx} sx={{ mb: 2 }}>
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
                    borderRadius: 8,
                    margin: "8px 0",
                    boxShadow:
                      "0 0 10px rgba(0,0,0,0.1)",
                  }}
                />
              )}
              {b.type === "video" && (
                <Typography color="text.secondary">
                  Видео: {b.content}
                </Typography>
              )}
              {b.type === "file" && b.content && (
                <a
                  href={b.content}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "var(--mui-palette-primary-main)",
                  }}
                >
                  📎 {decodeURIComponent(
                    b.content.split("/").pop() || "Файл"
                  )}
                </a>
              )}
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  </Box>
);
};
