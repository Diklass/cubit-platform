// src/types/quiz.ts
export enum QuestionType {
  SINGLE = "SINGLE",
  MULTI = "MULTI",
  SHORT_TEXT = "SHORT_TEXT",
  DROPDOWN = "DROPDOWN",
}

export interface QuizOption {
  id: string;
  order: number;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  order: number;
  type: QuestionType;
  text: string;
  explanation?: string | null;
  points: number;
  required: boolean;
  options: QuizOption[];
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  isPublished: boolean;
  passThreshold: number;
  maxAttempts?: number | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  timeLimitSec?: number | null;
  questions: QuizQuestion[];
}
