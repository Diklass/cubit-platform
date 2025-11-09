import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Stack
} from "@mui/material";
import {
  AddRounded,
} from "@mui/icons-material";
import api from "../../api";
import { QuestionItem } from "./QuestionItem";

interface Props {
  quiz: any;
  lessonId: string;
  onChange: () => void;
}

export function QuestionList({ quiz, lessonId, onChange }: Props) {
  const questions = quiz.questions ?? [];

  const createQuestion = async () => {
    await api.post(`/quiz/${quiz.id}/questions`, {
      text: "Новый вопрос",
      type: "SINGLE",
      required: true,
    });
    onChange();
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Вопросы
      </Typography>

      <Stack spacing={2}>
        {questions.length === 0 && (
          <Typography sx={{ opacity: 0.6 }}>
            Здесь пока нет вопросов…
          </Typography>
        )}

        {questions.map((q: any) => (
          <QuestionItem
            key={q.id}
            question={q}
            lessonId={lessonId}
            quizId={quiz.id}
            onChange={onChange}
          />
        ))}

        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={createQuestion}
          sx={{
            alignSelf: "flex-start",
            mt: 1,
            borderRadius: "12px",
          }}
        >
          Добавить вопрос
        </Button>
      </Stack>
    </Box>
  );
}
