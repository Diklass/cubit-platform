import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Checkbox,
  Radio,
  Stack,
  Select,
  MenuItem
} from "@mui/material";
import {
  DeleteOutline,
} from "@mui/icons-material";
import api from "../../api";

interface Props {
  option: any;
  questionType: "SINGLE" | "MULTI" | "SHORT_TEXT" | "DROPDOWN";
  onChange: () => void;
}

export function OptionItem({ option, questionType, onChange }: Props) {
  const [text, setText] = useState(option.text);
  const [isCorrect, setIsCorrect] = useState(option.isCorrect);

  const saveText = async () => {
    if (text !== option.text) {
      await api.patch(`/options/${option.id}`, { text });
      onChange();
    }
  };

  const toggleCorrect = async () => {
    const newValue = !isCorrect;
    setIsCorrect(newValue);

    // SINGLE → все остальные должны быть false
    await api.patch(`/options/${option.id}`, { isCorrect: newValue });

    onChange();
  };

  const deleteOption = async () => {
    await api.delete(`/options/${option.id}`);
    onChange();
  };

  return (
    <Paper
      sx={{
        p: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        borderRadius: 2,
        backgroundColor: "background.paper",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      }}
    >
      {/* CHECKBOX / RADIO */}
      {questionType === "SINGLE" && (
        <Radio
          checked={isCorrect}
          onChange={toggleCorrect}
        />
      )}

      {questionType === "MULTI" && (
        <Checkbox
          checked={isCorrect}
          onChange={toggleCorrect}
        />
      )}

      {questionType === "DROPDOWN" && (
        <Checkbox
          checked={isCorrect}
          onChange={toggleCorrect}
          sx={{ mr: 1 }}
        />
      )}

      {/* TEXT FIELD */}
      <TextField
        size="small"
        fullWidth
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={saveText}
      />

      {/* DELETE */}
      <IconButton color="error" onClick={deleteOption}>
        <DeleteOutline />
      </IconButton>
    </Paper>
  );
}
