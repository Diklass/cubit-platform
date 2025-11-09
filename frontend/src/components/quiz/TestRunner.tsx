import React from "react";
import { Box, Typography } from "@mui/material";

interface TestRunnerProps {
  quiz: any;
  lessonId?: string;
}

export function TestRunner({ quiz }: TestRunnerProps) {
  return (
    <Box sx={{ mt: 4, p: 2, borderRadius: 3, bgcolor: "background.paper" }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Тест "{quiz.title}"
      </Typography>

      <Typography>Студент скоро сможет пройти тест…</Typography>
    </Box>
  );
}
