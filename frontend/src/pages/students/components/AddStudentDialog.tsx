import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useStudentsApi } from "../hooks/useStudentsApi";

interface AddStudentDialogProps {
  open: boolean;
  onClose: () => void;
  subjectId: string;
  groupId?: string | null;
  onAdded?: () => void;
}

export default function AddStudentDialog({
  open,
  onClose,
  subjectId,
  groupId = null,
  onAdded,
}: AddStudentDialogProps) {
  const api = useStudentsApi();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const delay = setTimeout(() => {
      api
        .searchCandidates(subjectId, query)
        .then((r) => setResults(r))
        .finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(delay);
  }, [query]);

  const handleAdd = async (userId: string) => {
    setAddingId(userId);
    try {
      await api.addStudent(subjectId, { userId, groupId });
      onAdded?.();
      onClose();
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Добавить учащегося</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          autoFocus
          variant="outlined"
          label="Поиск по email"
          placeholder="student@school.com"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ mt: 1, mb: 2 }}
        />

        {loading ? (
          <CircularProgress size={32} sx={{ mt: 2 }} />
        ) : results.length > 0 ? (
          <List>
            {results.map((u) => (
              <ListItem
                key={u.id}
                button
                onClick={() => handleAdd(u.id)}
                disabled={addingId === u.id}
              >
                <ListItemText
                  primary={u.email}
                  secondary={`Создан: ${new Date(u.createdAt).toLocaleDateString()}`}
                />
                {addingId === u.id && <CircularProgress size={20} />}
              </ListItem>
            ))}
          </List>
        ) : query.trim() ? (
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Не найдено пользователей с таким email
          </Typography>
        ) : (
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Введите email или его часть для поиска
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
}
