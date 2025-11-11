import api from "../api";

// получить тест по уроку
export const getQuiz = (lessonId: string) =>
  api.get(`/lessons/${lessonId}/quiz`);

// создать тест
export const createQuiz = (lessonId: string, data: any) =>
  api.post(`/lessons/${lessonId}/quiz`, data);

// обновить тест
export const updateQuiz = (lessonId: string, data: any) =>
  api.patch(`/lessons/${lessonId}/quiz`, data);

// публичная версия (ученик)
export const getPublicQuiz = (lessonId: string) =>
  api.get(`/lessons/${lessonId}/quiz/public`);

export function submitQuiz(lessonId: string, answers: any) {
  return api.post(`/lessons/${lessonId}/quiz/submit`, { answers });
}
