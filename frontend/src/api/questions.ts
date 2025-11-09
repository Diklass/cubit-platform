import api from "../api";

export function createQuestion(quizId: string, data: any) {
  return api.post(`/quizzes/${quizId}/questions`, data);
}

export function updateQuestion(questionId: string, data: any) {
  return api.patch(`/questions/${questionId}`, data);
}

export function deleteQuestion(questionId: string) {
  return api.delete(`/questions/${questionId}`);
}

export function reorderQuestions(quizId: string, items: any[]) {
  return api.patch(`/quizzes/${quizId}/questions/reorder`, { items });
}
