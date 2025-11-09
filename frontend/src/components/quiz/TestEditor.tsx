import React from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { createQuestion } from "../../api/questions";
import { QuestionEditor } from "./QuestionEditor";
import { QuestionType } from "../../types/quiz";

interface TestEditorProps {
  lessonId: string;
  quiz: any;
  onQuizPatch: (mutator: (draft: any) => void) => void;
  refresh: () => void; // на будущее, если захочешь вручную синхронизировать
}

export function TestEditor({ quiz, onQuizPatch }: TestEditorProps) {
  const questions = quiz.questions || [];

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Тест: {quiz.title}
      </Typography>

      <Stack spacing={2}>
        {questions.length === 0 && (
          <Typography color="text.secondary">
            Пока нет вопросов. Добавьте первый!
          </Typography>
        )}

        {questions.map((q: any) => (
          <QuestionEditor
            key={q.id}
            question={q}
            onQuizPatch={onQuizPatch}
          />
        ))}
      </Stack>

      <Button
        startIcon={<AddIcon />}
        variant="contained"
        sx={{ mt: 3 }}
        onClick={async () => {
          const { data } = await createQuestion(quiz.id, {
            text: "Новый вопрос",
            type: "SINGLE" as QuestionType,
            required: true,
          });
          const created = data?.question ?? data;

          // Добавляем НИЗОМ локально — без перезагрузки и без “скачка”
          onQuizPatch((draft) => {
            draft.questions = draft.questions || [];
            draft.questions.push({ ...created, options: created.options ?? [] });
          });
        }}
      >
        Добавить вопрос
      </Button>
    </Box>
  );
}