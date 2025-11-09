import React, { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Paper,
  TextField,
  Select,
  MenuItem,
  Button,
} from "@mui/material";

import {
  createOption,
  updateOption,
  deleteOption,
} from "../../api/options";

import { updateQuestion, deleteQuestion } from "../../api/questions";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";

import { QuestionType } from "../../types/quiz";

interface Props {
  question: any;
  onQuizPatch: (mutator: (draft: any) => void) => void;
}

export function QuestionEditor({ question, onQuizPatch }: Props) {
  const [text, setText] = useState(question.text);
  const [type, setType] = useState<QuestionType>(question.type);

  // локальные варианты, чтобы UI обновлялся мгновенно
  const [options, setOptions] = useState(question.options);

  // синхронизация, когда родитель обновляет question
  useEffect(() => {
    setOptions(question.options);
  }, [question.options]);

  async function saveField(field: string, value: any) {
    await updateQuestion(question.id, { [field]: value });

    onQuizPatch((draft) => {
      const q = draft.questions.find((qq: any) => qq.id === question.id);
      if (q) q[field] = value;
    });
  }

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid rgba(0,0,0,0.12)",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Вопрос</Typography>

        <IconButton
          color="error"
          onClick={async () => {
            await deleteQuestion(question.id);

            onQuizPatch((draft) => {
              draft.questions = draft.questions.filter(
                (q: any) => q.id !== question.id
              );
            });
          }}
        >
          <DeleteOutlineIcon />
        </IconButton>
      </Stack>

      {/* текст вопроса */}
      <TextField
        fullWidth
        label="Текст вопроса"
        variant="outlined"
        sx={{ mt: 2 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => saveField("text", text)}
      />

      {/* тип вопроса */}
      <Select
  fullWidth
  sx={{ mt: 2 }}
  value={type}
  onChange={async (e) => {
    const newType = e.target.value as QuestionType;
    setType(newType);
    await saveField("type", newType);

    // ---- SHORT_TEXT → очищаем варианты ----
    if (newType === "SHORT_TEXT") {
      setOptions([]);
      onQuizPatch((draft) => {
        const q = draft.questions.find((qq: any) => qq.id === question.id);
        if (q) q.options = [];
      });
      return;
    }

    // ---- переход ИЗ SHORT_TEXT обратно к выбору ----
    if (type === "SHORT_TEXT") {
      // создаем 1 новый вариант, чтобы пользователь видел UI
      const { data } = await createOption(question.id);
      const created = data?.option ?? data;

      // локально
      setOptions([created]);

      // глобально
      onQuizPatch((draft) => {
        const q = draft.questions.find((qq: any) => qq.id === question.id);
        if (!q) return;
        q.options = [created];
      });
    }
  }}
>
  <MenuItem value="SINGLE">Один правильный ответ</MenuItem>
  <MenuItem value="MULTI">Несколько правильных ответов</MenuItem>
  <MenuItem value="SHORT_TEXT">Ответ текстом</MenuItem>
  <MenuItem value="DROPDOWN">Выпадающий список</MenuItem>
</Select>

      {/* варианты ответа */}
     <Box sx={{ mt: 3 }}>
  <Typography variant="subtitle1" sx={{ mb: 1 }}>
    Ответы
  </Typography>

  {/* === ТЕКСТОВЫЙ ТИП === */}
  {type === "SHORT_TEXT" && (
    <Box>
      <Typography sx={{ mb: 1, opacity: 0.8, fontSize: 14 }}>
        Введите правильные ответы через запятую.  
        Пример: <b>Москва, МСК, Moscow</b>
      </Typography>

      <TextField
        fullWidth
        label="Правильный ответ"
        variant="outlined"
        value={question.explanation || ""}
        onChange={(e) => {
          const val = e.target.value;

          // локально сразу обновляем, чтобы UI менялся
          onQuizPatch((draft) => {
            const q = draft.questions.find((qq: any) => qq.id === question.id);
            if (q) q.explanation = val;
          });
        }}
        onBlur={async (e) => {
          const val = e.target.value;
          await updateQuestion(question.id, { explanation: val });
        }}
      />
    </Box>
  )}

  {/* === ОСТАЛЬНЫЕ ТИПЫ (варианты ответа) === */}
  {type !== "SHORT_TEXT" && (
    <Stack spacing={1}>
      {options.map((opt: { id: string; isCorrect: boolean | undefined; text: unknown; }) => (
        <Paper
          key={opt.id}
          sx={{
            p: 1.5,
            pl: 2,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          {/* Правильность отмечается radio/checkbox */}
          {(type === "SINGLE" || type === "DROPDOWN") && (
            <input
              type="radio"
              name={`q-${question.id}`}
              checked={opt.isCorrect}
              onChange={async () => {
                await updateOption(opt.id, { isCorrect: true });

                onQuizPatch((draft) => {
                  const q = draft.questions.find((qq: any) => qq.id === question.id);
                  if (!q) return;
                  q.options.forEach((o: any) => (o.isCorrect = o.id === opt.id));
                });
              }}
            />
          )}

          {type === "MULTI" && (
            <input
              type="checkbox"
              checked={opt.isCorrect}
              onChange={async (e) => {
                await updateOption(opt.id, { isCorrect: e.target.checked });

                onQuizPatch((draft) => {
                  const q = draft.questions.find((qq: any) => qq.id === question.id);
                  if (!q) return;
                  const o = q.options.find((oo: any) => oo.id === opt.id);
                  if (o) o.isCorrect = e.target.checked;
                });
              }}
            />
          )}

          {/* Текст варианта */}
          <TextField
            fullWidth
            value={opt.text}
            onChange={(e) => {
              const val = e.target.value;
              onQuizPatch((draft) => {
                const q = draft.questions.find((qq: any) => qq.id === question.id);
                if (!q) return;
                const o = q.options.find((oo: any) => oo.id === opt.id);
                if (o) o.text = val;
              });
            }}
            onBlur={async (e) => {
              const val = e.target.value;
              await updateOption(opt.id, { text: val });
            }}
          />

          <IconButton
            color="error"
            onClick={async () => {
              await deleteOption(opt.id);
              onQuizPatch((draft) => {
                const q = draft.questions.find((qq: any) => qq.id === question.id);
                if (!q) return;
                q.options = q.options.filter((o: any) => o.id !== opt.id);
              });
            }}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Paper>
      ))}

      {/* Кнопка "добавить вариант" */}
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={async () => {
          const { data } = await createOption(question.id);
          const created = data.option ?? data;

          onQuizPatch((draft) => {
            const q = draft.questions.find((qq: any) => qq.id === question.id);
            if (!q) return;
            q.options.push(created);
          });
        }}
      >
        Добавить вариант
      </Button>
    </Stack>
  )}
</Box>
    </Paper>
  );
}
