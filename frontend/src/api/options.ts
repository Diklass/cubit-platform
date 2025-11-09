import api from "../api";

export function createOption(questionId: string) {
  return api.post(`/questions/${questionId}/options`, {
    text: "Новый вариант",
    isCorrect: false,
  });
}

export function updateOption(optionId: string, data: any) {
  return api.patch(`/options/${optionId}`, data);
}

export function deleteOption(optionId: string) {
  return api.delete(`/options/${optionId}`);
}

export function reorderOptions(questionId: string, items: any[]) {
  return api.patch(`/questions/${questionId}/options/reorder`, { items });
}
