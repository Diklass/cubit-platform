import React, { useState } from "react";
import {
  Box,
  TextField,
  Switch,
  FormControlLabel,
  Typography,
  Stack,
  Button,
  Slider,
  useTheme
} from "@mui/material";
import api from "../../api";
import { Theme } from "@mui/material/styles";

interface Props {
  lessonId: string;
  quiz: any;
  onChange: () => void;
}

export function TestSettings({ lessonId, quiz, onChange }: Props) {
  const theme = useTheme();

  const [values, setValues] = useState({
    title: quiz.title || "",
    passThreshold: quiz.passThreshold || 70,
    maxAttempts: quiz.maxAttempts ?? 1,
    shuffleQuestions: quiz.shuffleQuestions,
    shuffleOptions: quiz.shuffleOptions,
    timeLimitSec: quiz.timeLimitSec ?? 0,
    isPublished: quiz.isPublished,
  });

  const updateField = (field: string, value: any) => {
    setValues((v) => ({ ...v, [field]: value }));
  };

  const save = async () => {
    await api.patch(`/lessons/${lessonId}/quiz`, values);
    onChange();
  };

  return (
    <Box
      sx={(theme: Theme) => ({
        p: 3,
        mb: 3,
        borderRadius: 3,
        backgroundColor: theme.palette.background.paper,
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 4px 12px rgba(0,0,0,0.35)"
            : "0 4px 12px rgba(0,0,0,0.1)",
        transition: "0.3s ease",
      })}
    >
      <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
        Настройки теста
      </Typography>

      <Stack spacing={3}>
        
        {/* Название теста */}
        <TextField
          label="Название теста"
          value={values.title}
          onChange={(e) => updateField("title", e.target.value)}
          fullWidth
        />

        {/* Порог прохождения */}
        <Box>
          <Typography sx={{ mb: 1 }}>
            Порог прохождения: {values.passThreshold}%
          </Typography>
          <Slider
            value={values.passThreshold}
            onChange={(_: Event, val: number | number[]) =>
  updateField("passThreshold", val as number)
}
            min={0}
            max={100}
            step={1}
          />
        </Box>

        {/* Количество попыток */}
        <TextField
          label="Максимальное количество попыток"
          type="number"
          value={values.maxAttempts}
          onChange={(e) => updateField("maxAttempts", Number(e.target.value))}
          fullWidth
        />

        {/* Перемешивание */}
        <FormControlLabel
          control={
            <Switch
              checked={values.shuffleQuestions}
              onChange={(e) =>
                updateField("shuffleQuestions", e.target.checked)
              }
            />
          }
          label="Перемешивать вопросы"
        />

        <FormControlLabel
          control={
            <Switch
              checked={values.shuffleOptions}
              onChange={(e) =>
                updateField("shuffleOptions", e.target.checked)
              }
            />
          }
          label="Перемешивать варианты ответов"
        />

        {/* Таймер */}
        <TextField
          label="Ограничение по времени (сек)"
          type="number"
          value={values.timeLimitSec}
          onChange={(e) =>
            updateField("timeLimitSec", Number(e.target.value))
          }
          fullWidth
        />

        {/* Публикация */}
        <Button
          variant="contained"
          color={values.isPublished ? "warning" : "primary"}
          onClick={() => {
            updateField("isPublished", !values.isPublished);
            save();
          }}
        >
          {values.isPublished ? "Снять с публикации" : "Опубликовать тест"}
        </Button>

        {/* Кнопка сохранения */}
        <Button
          variant="outlined"
          onClick={save}
          sx={{
            mt: 1,
            borderRadius: "12px",
            px: 3,
            py: 1,
          }}
        >
          Сохранить изменения
        </Button>
      </Stack>
    </Box>
  );
}
