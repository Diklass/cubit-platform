//src/pages/students/components/GroupCard.tsx
import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  IconButton,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useNavigate } from "react-router-dom";
import { useStudentsApi } from "../hooks/useStudentsApi";

interface GroupCardProps {
  group: any;
  subjectId: string;
  onReload: () => void;
}

export function GroupCard({ group, subjectId, onReload }: GroupCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(group.name);
  const api = useStudentsApi();
  const navigate = useNavigate();

  const handleRename = async () => {
    await api.renameGroup(subjectId, group.id, newName);
    setIsEditing(false);
    onReload();
  };

  const handleDelete = async () => {
    if (confirm("Удалить эту группу?")) {
      await api.deleteGroup(subjectId, group.id);
      onReload();
    }
  };

  return (
    <Card
      onClick={() => !isEditing && navigate(`/students/${subjectId}/${group.id}`)}
      className="cursor-pointer transition hover:shadow-lg relative"
    >
      <CardContent>
        {isEditing ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              size="small"
              variant="outlined"
              fullWidth
            />
            <IconButton color="success" size="small" onClick={handleRename}>
              <CheckRoundedIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => {
                setIsEditing(false);
                setNewName(group.name);
              }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <>
            <Typography variant="h6">{group.name}</Typography>
            <Typography color="text.secondary">
              Учащихся: {group.students.length}
            </Typography>
          </>
        )}
      </CardContent>

      {!isEditing && (
        <Box sx={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={(e: { stopPropagation: () => void; }) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <EditRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(e: { stopPropagation: () => void; }) => {
              e.stopPropagation();
              handleDelete();
            }}
          >
            <DeleteOutlineRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </Card>
  );
}
