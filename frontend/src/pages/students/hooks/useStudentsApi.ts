import api from '../../../api';

export function useStudentsApi() {
  return {
    getSubjects: () => api.get('/students/subjects').then(r => r.data),
    getGroups: (subjectId: string) => api.get(`/students/${subjectId}/groups`).then(r => r.data),
    createGroup: (subjectId: string, name: string) =>
      api.post(`/students/${subjectId}/groups`, { name }).then(r => r.data),
    renameGroup: (subjectId: string, groupId: string, name: string) =>
      api.patch(`/students/${subjectId}/groups/${groupId}`, { name }).then(r => r.data),
    deleteGroup: (subjectId: string, groupId: string, mode = 'reassign') =>
      api.delete(`/students/${subjectId}/groups/${groupId}?mode=${mode}`).then(r => r.data),

    addStudent: (subjectId: string, payload: any) =>
      api.post(`/students/${subjectId}/add`, payload).then(r => r.data),
    moveStudent: (subjectId: string, linkId: string, targetGroupId?: string | null) =>
      api.post(`/students/${subjectId}/students/${linkId}/move`, { targetGroupId }).then(r => r.data),
    removeStudent: (subjectId: string, linkId: string) =>
      api.delete(`/students/${subjectId}/students/${linkId}`).then(r => r.data),

    searchCandidates: (subjectId: string, q: string) =>
      api.get(`/students/${subjectId}/candidates?q=${encodeURIComponent(q)}`).then(r => r.data),
    getStats: (subjectId: string) =>
      api.get(`/students/${subjectId}/stats`).then(r => r.data),
    getGroupStats: (subjectId: string, groupId: string) =>
  api.get(`/students/${subjectId}/groups/${groupId}/stats`).then((r) => r.data),
    getSubjectStats: (subjectId: string) =>
  api.get(`/students/${subjectId}/stats`).then((r) => r.data),
    getStudentStats: (subjectId: string, userId: string) =>
  api.get(`/students/${subjectId}/student/${userId}/stats`).then((r) => r.data),

  };
}
