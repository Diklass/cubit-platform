//src/pages/students/components/StudentCard.tsx
import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  Tooltip,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { motion } from "framer-motion";
import { useStudentsApi } from "../hooks/useStudentsApi";
import { useNavigate } from "react-router-dom";

interface StudentCardProps {
  subjectId: string;
  student: any; // subjectStudent
  onRemoved?: () => void;
}

export function StudentCard({ subjectId, student, onRemoved }: StudentCardProps) {
  const api = useStudentsApi();
  const navigate = useNavigate();

  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation(); // ❗ чтобы клик по кнопке не открывал статистику
    if (!confirm(`Удалить ${student.user.email} из группы?`)) return;
    setIsRemoving(true);
    await api.removeStudent(subjectId, student.id);
    onRemoved?.();
  };

  const goToStats = () => {
    navigate(`/students/${subjectId}/student/${student.userId}`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <Card
        onClick={goToStats}
        sx={{
          position: "relative",
          borderRadius: 2,
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.25s ease",
          "&:hover": {
            boxShadow: 8,
            transform: "translateY(-2px)",
          },
          "&:active": {
            transform: "scale(0.98)",
          },
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography fontWeight={600}>{student.user.email}</Typography>
              <Typography variant="body2" color="text.secondary">
                Зарегистрирован:{" "}
                {new Date(student.user.createdAt).toLocaleDateString()}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={0.5}>
              {/* Кнопка "инфо" теперь активна */}
              <Tooltip title="Статистика ученика">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e: { stopPropagation: () => void; }) => {
                    e.stopPropagation();
                    goToStats();
                  }}
                >
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Удалить учащегося">
                <IconButton
                  size="small"
                  color="error"
                  onClick={handleRemove}
                  disabled={isRemoving}
                >
                  {isRemoving ? (
                    <CheckCircleRoundedIcon fontSize="small" />
                  ) : (
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}
