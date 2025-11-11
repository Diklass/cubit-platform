import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Stack,
  Chip,
  Divider,
} from "@mui/material";
import { getQuizAttempts } from "../../api/quiz";

export function TestAttempts({ lessonId }: { lessonId: string }) {
  const [attempts, setAttempts] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lessonId) return;

    getQuizAttempts(lessonId)
      .then((data) => setAttempts(data))
      .finally(() => setLoading(false));
  }, [lessonId]);

  if (loading)
    return (
      <Box sx={{ p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );

  if (!attempts || attempts.length === 0)
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">Нет попыток прохождения.</Typography>
      </Box>
    );

  // Вычисляем статистику
  const passedCount = attempts.filter((a) => a.passed).length;
  const avgPercent = Math.round(
    attempts.reduce((sum, a) => sum + a.percent, 0) / attempts.length
  );

  return (
    <Box
      sx={{
        mt: 4,
        p: 2,
        borderRadius: 2,
        border: "1px solid rgba(0,0,0,0.1)",
      }}
    >
      <Typography variant="h6" sx={{ mb: 1 }}>
        Статистика теста
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Chip label={`Попыток: ${attempts.length}`} />
        <Chip label={`Успешно: ${passedCount}`} color="success" />
        <Chip label={`Средний результат: ${avgPercent}%`} color="primary" />
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Последние попытки:
      </Typography>

      <Stack spacing={1}>
        {attempts.slice(0, 5).map((a) => (
          <Box
            key={a.id}
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <Typography sx={{ fontWeight: 600 }}>
              {a.user?.email || "Неизвестно"}
            </Typography>

            <Typography variant="body2">
              Результат: {a.percent}% / Попытка №{a.tryIndex}
            </Typography>

            <Typography
              variant="body2"
              color={a.passed ? "success.main" : "error.main"}
            >
              {a.passed ? "Зачёт ✅" : "Не зачтено ❌"}
            </Typography>
          </Box>
        ))}
      </Stack>

      {attempts.length > 5 && (
        <Typography
          variant="body2"
          sx={{ mt: 1 }}
          color="text.secondary"
        >
          …ещё {attempts.length - 5} попыток
        </Typography>
      )}
    </Box>
  );
}
