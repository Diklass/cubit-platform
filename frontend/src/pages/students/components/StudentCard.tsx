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

interface StudentCardProps {
  subjectId: string;
  student: any;
  onRemoved?: () => void;
}

export function StudentCard({ subjectId, student, onRemoved }: StudentCardProps) {
  const api = useStudentsApi();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    if (!confirm(`Удалить ${student.user.email} из группы?`)) return;
    setIsRemoving(true);
    await api.removeStudent(subjectId, student.id);
    onRemoved?.();
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
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 2,
          transition: "all 0.25s ease",
          "&:hover": { boxShadow: 6 },
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
              <Tooltip title="Посмотреть прогресс (скоро)">
                <span>
                  <IconButton size="small" color="primary" disabled>
                    <InfoOutlinedIcon fontSize="small" />
                  </IconButton>
                </span>
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
