import { useEffect, useState } from "react";
import { useStudentsApi } from "../hooks/useStudentsApi";
import { Box, Typography, CircularProgress, Paper } from "@mui/material";
import { motion } from "framer-motion";

interface GroupStatsPanelProps {
  subjectId: string;
  groupId: string;
}

export function GroupStatsPanel({ subjectId, groupId }: GroupStatsPanelProps) {
  const api = useStudentsApi();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getGroupStats(subjectId, groupId).then(setStats).finally(() => setLoading(false));
  }, [subjectId, groupId]);

  if (loading)
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );

  if (!stats) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 3,
          mt: 3,
          background: "linear-gradient(145deg, #f8fafc, #ffffff10)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Typography variant="h6" fontWeight="600" gutterBottom>
          📊 Статистика группы
        </Typography>
        <Typography>
          <b>Название:</b> {stats.name}
        </Typography>
        <Typography>
          <b>Количество учащихся:</b> {stats.studentsCount}
        </Typography>
        <Typography color="text.secondary" fontSize="0.9rem" sx={{ mt: 1 }}>
          (В дальнейшем сюда можно добавить средний прогресс, количество завершённых тестов и т.д.)
        </Typography>
      </Paper>
    </motion.div>
  );
}
