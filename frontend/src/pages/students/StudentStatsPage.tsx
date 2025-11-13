import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Paper, CircularProgress, Button } from "@mui/material";
import { motion } from "framer-motion";
import { useStudentsApi } from "./hooks/useStudentsApi";
import { ArrowBack } from "@mui/icons-material";

export default function StudentStatsPage() {
  const { subjectId, userId } = useParams();
  const navigate = useNavigate();
  const api = useStudentsApi();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subjectId || !userId) return;
    api
      .getStudentStats(subjectId, userId)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [subjectId, userId]);

  if (loading)
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );

  if (!stats)
    return (
      <Typography align="center" mt={5}>
        Нет данных по ученику.
      </Typography>
    );

  return (
    <Box p={3}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        Назад
      </Button>

      <Typography variant="h5" fontWeight={600} gutterBottom>
        📊 Статистика ученика
      </Typography>

      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          background:
            "linear-gradient(145deg, rgba(59,130,246,0.08), rgba(168,85,247,0.08))",
        }}
      >
        <Typography>
          <b>Средний результат:</b> {stats.avgPercent}%
        </Typography>
        <Typography>
          <b>Попыток тестов:</b> {stats.totalAttempts}
        </Typography>
        <Typography>
          <b>Пройдено успешно:</b> {stats.passedAttempts}
        </Typography>
      </Paper>

      <Typography variant="h6" mb={1}>
        🧩 Детализация по тестам
      </Typography>

      {stats.attempts.length === 0 ? (
        <Typography color="text.secondary">
          Ученик ещё не проходил тесты.
        </Typography>
      ) : (
        stats.attempts.map((a: any, idx: number) => (
          <motion.div
            key={a.quizId + idx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Paper
              sx={{
                p: 2.5,
                mb: 2,
                borderRadius: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography fontWeight={500}>{a.lessonTitle}</Typography>
                <Typography fontSize="0.85rem" color="text.secondary">
                  {a.submittedAt
                    ? new Date(a.submittedAt).toLocaleString("ru-RU")
                    : "Не завершено"}
                </Typography>
              </Box>
              <Typography
                color={a.passed ? "success.main" : "error.main"}
                fontWeight={600}
              >
                {a.percent ?? 0}%
              </Typography>
            </Paper>
          </motion.div>
        ))
      )}
    </Box>
  );
}
