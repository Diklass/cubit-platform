import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  TextField,
  MenuItem,
  Alert,
  Divider,
} from "@mui/material";
import api from "../../api";

export function TestRunner({ quiz, lessonId }: any) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data } = await api.post(
        `/lessons/${lessonId}/quiz/check`,
        { answers }
      );

      setResult(data);
    } catch (err) {
      console.error("Ошибка проверки теста", err);
      alert("Произошла ошибка при проверке теста");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* === Если тест уже пройден и есть результат === */}
      {result && (
        <Box
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            border: "1px solid rgba(0,0,0,0.2)",
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            ✅ Результат теста
          </Typography>

          <Alert severity={result.passed ? "success" : "error"}>
            {result.passed
              ? "Поздравляем! Тест пройден!"
              : "Тест не пройден."}
          </Alert>

          <Typography sx={{ mt: 1 }}>
            Ваш результат: <b>{result.percent}%</b> ({result.correctCount} из{" "}
            {result.total})
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1">Детали:</Typography>

          {result.details.map((d: any) => (
            <Box key={d.questionId} sx={{ mt: 2 }}>
              <Typography>
                <b>{d.question}</b>
              </Typography>

              {d.correct ? (
                <Typography color="green">✔ Правильно</Typography>
              ) : (
                <Typography color="red">✘ Неправильно</Typography>
              )}

              <Typography sx={{ fontSize: 14, mt: 0.5 }}>
                Правильный ответ:{" "}
                {d.correctOptions.length > 0
                  ? d.correctOptions.join(", ")
                  : "нет"}
              </Typography>

              <Divider sx={{ mt: 1 }} />
            </Box>
          ))}
        </Box>
      )}

      {/* === Сами вопросы === */}
      {(quiz.questions || []).map((q: any) => (
        <Box key={q.id} sx={{ mb: 4 }}>
          <Typography variant="h6">{q.text}</Typography>

          {/* SINGLE */}
          {q.type === "SINGLE" && (
            <RadioGroup
              value={answers[q.id] || ""}
              onChange={(e) => handleSelect(q.id, e.target.value)}
            >
              {q.options.map((o: any) => (
                <FormControlLabel
                  key={o.id}
                  value={o.id}
                  control={<Radio />}
                  label={o.text}
                />
              ))}
            </RadioGroup>
          )}

          {/* DROPDOWN */}
          {q.type === "DROPDOWN" && (
            <TextField
              select
              fullWidth
              label="Выберите вариант"
              value={answers[q.id] || ""}
              onChange={(e) => handleSelect(q.id, e.target.value)}
              sx={{ mt: 1 }}
            >
              {q.options.map((o: any) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.text}
                </MenuItem>
              ))}
            </TextField>
          )}

          {/* MULTI */}
          {q.type === "MULTI" && (
            <Box sx={{ mt: 1 }}>
              {q.options.map((o: any) => (
                <FormControlLabel
                  key={o.id}
                  control={
                    <Checkbox
                      checked={(answers[q.id] || []).includes(o.id)}
                      onChange={(e) => {
                        const set = new Set(answers[q.id] || []);
                        e.target.checked ? set.add(o.id) : set.delete(o.id);
                        handleSelect(q.id, Array.from(set));
                      }}
                    />
                  }
                  label={o.text}
                />
              ))}
            </Box>
          )}

          {/* SHORT_TEXT */}
          {q.type === "SHORT_TEXT" && (
            <TextField
              fullWidth
              placeholder="Введите ответ"
              value={answers[q.id] || ""}
              onChange={(e) => handleSelect(q.id, e.target.value)}
              sx={{ mt: 1 }}
            />
          )}
        </Box>
      ))}

      <Button
        variant="contained"
        size="large"
        disabled={loading}
        onClick={handleSubmit}
      >
        {loading ? "Проверяем..." : "Завершить тест"}
      </Button>
    </Box>
  );
}
