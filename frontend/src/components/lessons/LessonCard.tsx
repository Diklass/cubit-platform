// src/components/lessons/LessonCard.tsx
import React from "react";
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  IconButton,
  Box,
  Divider,
  useTheme,
} from "@mui/material";
import { DeleteOutline, EditOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

interface LessonCardProps {
  id: string;
  title: string;
  role?: "ADMIN" | "TEACHER" | "STUDENT" | "GUEST";
  onDelete?: () => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  id,
  title,
  role = "STUDENT",
  onDelete,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isTeacher = role === "TEACHER" || role === "ADMIN";

  return (
<Card
  elevation={3}
  sx={{
    borderRadius: 2,
    height: 200,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    boxShadow:
      theme.palette.mode === "dark"
        ? "0px 1px 3px rgba(0,0,0,0.8)"
        : theme.shadows[3],
    transition:
      "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow:
        theme.palette.mode === "dark"
          ? "0px 2px 8px rgba(0,0,0,0.9)"
          : theme.shadows[6],
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
          px: 2,
        }}
      >
        <CardContent sx={{ py: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: "32px",
              textTransform: "uppercase",
              letterSpacing: ".5px",
              color: theme.palette.text.primary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </Typography>
        </CardContent>
      </CardActionArea>

      {/* Разделительная линия и нижняя панель */}
      {isTeacher && (
        <>
          <Divider />
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
              onClick={() => navigate(`/lessons/edit/${id}`)}
            >
              <EditOutlined />
            </IconButton>
            <IconButton
              color="error"
              size="small"
              onClick={() => {
                if (confirm(`Удалить урок "${title}"?`)) onDelete?.();
              }}
            >
              <DeleteOutline />
            </IconButton>
          </Box>
        </>
      )}
    </Card>
  );
};
