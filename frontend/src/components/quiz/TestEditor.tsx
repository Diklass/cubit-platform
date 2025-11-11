import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Chip,
  CircularProgress,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PublicIcon from "@mui/icons-material/Public";
import PublicOffIcon from "@mui/icons-material/PublicOff";

import { createQuestion } from "../../api/questions";
import { updateQuiz } from "../../api/quiz";
import { QuestionEditor } from "./QuestionEditor";

interface TestEditorProps {
  lessonId: string;
  quiz: any;
  onChange: () => void;
}

export function TestEditor({ lessonId, quiz, onChange }: TestEditorProps) {
  // ✅ локальное состояние теста — чтобы порог, вопросы и publish обновлялись без дерганий
  const [localQuiz, setLocalQuiz] = useState(quiz);
  const questions = Array.isArray(localQuiz?.questions)
    ? localQuiz.questions
    : [];

  const [publishing, setPublishing] = useState(false);

  // ✅ универсальный патчер локального теста (как в QuestionEditor)
  const onQuizPatch = (mutator: (draft: any) => void) => {
    setLocalQuiz((prev: any) => {
      const copy = structuredClone(prev);
      mutator(copy);
      return copy;
    });
  };

  async function handleTogglePublish() {
    try {
      setPublishing(true);

      await updateQuiz(lessonId, { isPublished: !localQuiz.isPublished });

      onQuizPatch((draft) => {
        draft.isPublished = !draft.isPublished;
      });

      onChange();
    } finally {
      setPublishing(false);
    }
  }

  async function handleAddQuestion() {
    const { data } = await createQuestion(localQuiz.id, {
      text: "Новый вопрос",
      type: "SINGLE",
      required: true,
    });

    onQuizPatch((draft) => {
      draft.questions.push(data.question ?? data);
    });

    onChange();
  }

  const published = !!localQuiz.isPublished;

  return (
    <Box sx={{ mt: 4 }}>
      {/* Шапка */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5">Тест: {localQuiz.title}</Typography>

        {/* Порог прохождения */}
        <TextField
          label="Порог прохождения (%)"
          type="number"
          value={localQuiz.passThreshold ?? 0}
          sx={{ maxWidth: 240 }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const val = Math.min(100, Math.max(0, Number(e.target.value)));

            onQuizPatch((draft) => {
              draft.passThreshold = val;
            });
          }}
          onBlur={async (e) => {
            const val = Math.min(100, Math.max(0, Number(e.target.value)));
            await updateQuiz(lessonId, { passThreshold: val });
            onChange();
          }}
        />

        {/* publish */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={published ? "Опубликован" : "Черновик"}
            color={published ? "success" : "default"}
            variant={published ? "filled" : "outlined"}
            size="small"
          />

          <Button
            variant={published ? "outlined" : "contained"}
            startIcon={
              publishing ? (
                <CircularProgress size={18} />
              ) : published ? (
                <PublicOffIcon />
              ) : (
                <PublicIcon />
              )
            }
            onClick={handleTogglePublish}
            disabled={publishing}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {published ? "Снять с публикации" : "Опубликовать"}
          </Button>
        </Stack>
      </Stack>

      {/* Список вопросов */}
      <Stack spacing={2}>
        {questions.length === 0 && (
          <Typography color="text.secondary">
            Пока нет вопросов. Добавьте первый!
          </Typography>
        )}

        {questions.map((q: any) => (
          <Paper
            key={q.id}
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px solid rgba(0,0,0,0.1)",
            }}
          >
            <QuestionEditor
              question={q}
              onQuizPatch={onQuizPatch}
            />
          </Paper>
        ))}
      </Stack>

      {/* Добавить вопрос */}
      <Button
        startIcon={<AddIcon />}
        variant="contained"
        sx={{ mt: 3 }}
        onClick={handleAddQuestion}
      >
        Добавить вопрос
      </Button>

      <Typography variant="body2" sx={{ mt: 1.5 }} color="text.secondary">
        Тест появится у ученика в конце урока, когда статус станет «Опубликован».
      </Typography>
    </Box>
  );
}
