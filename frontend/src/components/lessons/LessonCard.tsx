import React from "react";
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Divider,
  Box,
  IconButton,
  useTheme,
} from "@mui/material";
import { EditOutlined, DeleteOutline } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import api from "../../api";

type Role = "ADMIN" | "TEACHER" | "STUDENT" | "GUEST";

interface LessonCardProps {
  id: string;
  title: string;
  role?: Role;
  onDelete?: () => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  id,
  title,
  role = "STUDENT",
  onDelete,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isTeacher = role === "TEACHER" || role === "ADMIN";

  const handleDelete = async () => {
    if (!confirm("Удалить этот урок?")) return;
    await api.delete(`/subjects/lessons/${id}`);
    onDelete?.();
  };

  return (
    <Card
      elevation={3}
      sx={{
        borderRadius: 2,
        height: 220,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: theme.shadows[6],
        },
      }}
    >
      <CardActionArea
        onClick={() => navigate(`/lessons/view/${id}`)}
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <CardContent sx={{ py: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: ".6px",
              fontSize: "22px",
              color: theme.palette.text.primary,
            }}
          >
            {title}
          </Typography>
        </CardContent>
      </CardActionArea>

      <Divider />

      {/* === Нижняя панель управления === */}
      {isTeacher && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            px: 1.5,
            py: 1,
            gap: 0.5,
          }}
        >
          <IconButton
            color="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/lessons/edit/${id}`);
            }}
          >
            <EditOutlined />
          </IconButton>
          <IconButton
            color="error"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
          >
            <DeleteOutline />
          </IconButton>
        </Box>
      )}
    </Card>
  );
};
