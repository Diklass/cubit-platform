import { useEffect, useState } from "react";
import { useStudentsApi } from "../hooks/useStudentsApi";
import { Box, Paper, Typography, CircularProgress } from "@mui/material";
import { motion } from "framer-motion";

interface SubjectStatsPanelProps {
  subjectId: string;
}

export function SubjectStatsPanel({ subjectId }: SubjectStatsPanelProps) {
  const api = useStudentsApi();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getSubjectStats(subjectId)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [subjectId]);

  if (loading)
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );

  if (!stats) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 250, damping: 22 }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mt: 3,
          borderRadius: 3,
          background: "linear-gradient(145deg, #f8fafc, #ffffff10)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Typography variant="h6" fontWeight={600} gutterBottom>
          📘 Статистика предмета
        </Typography>
        <Typography>
          <b>Количество групп:</b> {stats.groupsCount}
        </Typography>
        <Typography>
          <b>Количество учащихся:</b> {stats.studentsCount}
        </Typography>
        <Typography color="text.secondary" fontSize="0.9rem" sx={{ mt: 1 }}>
          (Позже сюда можно добавить средний прогресс по урокам, тестам и активности)
        </Typography>
      </Paper>
    </motion.div>
  );
}
