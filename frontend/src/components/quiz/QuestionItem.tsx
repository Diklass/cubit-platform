import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  Stack
} from "@mui/material";

import {
  DeleteOutline,
} from "@mui/icons-material";

import api from "../../api";
import { OptionList } from "./OptionList";

interface Props {
  question: any;
  lessonId: string;
  quizId: string;
  onChange: () => void;
}

const QUESTION_TYPES = [
  { value: "SINGLE", label: "Один правильный ответ" },
  { value: "MULTI", label: "Несколько правильных" },
  { value: "SHORT_TEXT", label: "Короткий ответ" },
  { value: "DROPDOWN", label: "Выпадающий список" },
];

export function QuestionItem({ question, quizId, onChange }: Props) {
  const [text, setText] = useState(question.text);
  const [type, setType] = useState(question.type);

  const saveText = async () => {
    if (text !== question.text) {
      await api.patch(`/questions/${question.id}`, { text });
      onChange();
    }
  };

  const saveType = async (newType: string) => {
    setType(newType);
    await api.patch(`/questions/${question.id}`, { type: newType });
    onChange();
  };

  const deleteQuestion = async () => {
    await api.delete(`/questions/${question.id}`);
    onChange();
  };

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 3,
        backgroundColor: "background.paper",
        boxShadow:
          "0 2px 6px rgba(0,0,0,0.08)",
        transition: "0.2s",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
        },
      }}
    >
      <Stack spacing={2}>
        
        {/* Текст вопроса */}
        <TextField
          fullWidth
          label="Текст вопроса"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={saveText}
        />

        {/* Тип вопроса */}
        <FormControl fullWidth>
          <Select
            value={type}
            onChange={(e) => saveType(e.target.value)}
          >
            {QUESTION_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Кнопка удаления */}
        <Box sx={{ textAlign: "right" }}>
          <IconButton color="error" onClick={deleteQuestion}>
            <DeleteOutline />
          </IconButton>
        </Box>

      </Stack>
    </Paper>
    
  );
  <OptionList question={question} onChange={onChange} />
}
