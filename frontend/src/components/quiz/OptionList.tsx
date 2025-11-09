import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack
} from "@mui/material";
import { AddRounded } from "@mui/icons-material";
import api from "../../api";
import { OptionItem } from "./OptionItem";

interface Props {
  question: any;
  onChange: () => void;
}

export function OptionList({ question, onChange }: Props) {
  const options = question.options ?? [];

  const createOption = async () => {
    await api.post(`/questions/${question.id}/options`, {
      text: "Новый вариант",
      isCorrect: false,
      order: options.length,
    });
    onChange();
  };

  return (
    <Box sx={{ mt: 2, ml: 1 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Варианты ответа
      </Typography>

      <Stack spacing={1.5}>
        {options.map((opt: any) => (
          <OptionItem
            key={opt.id}
            option={opt}
            questionType={question.type}
            onChange={onChange}
          />
        ))}

        {/* Кнопка добавления */}
        {question.type !== "SHORT_TEXT" && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddRounded />}
            onClick={createOption}
            sx={{ alignSelf: "flex-start" }}
          >
            Добавить вариант
          </Button>
        )}
      </Stack>
    </Box>
  );
}
