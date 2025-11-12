import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { PrivateRoute } from "./auth/PrivateRoute";
import { RoleRoute } from "./auth/RoleRoute";
import Layout from "./components/Layout";

import LoginOrJoin from "./pages/LoginOrJoin";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import { RoomJoin } from "./pages/RoomJoin";
import { RoomPage } from "./pages/RoomPage";

// === Новый порядок импортов для уроков ===
import LessonsListPage from "./pages/lessons/LessonsListPage";
import SubjectOverviewPage from "./pages/lessons/SubjectOverviewPage";
import ModuleOverviewPage from "./pages/lessons/ModuleOverviewPage";
import LessonContentPage from "./pages/lessons/LessonContentPage";
import LessonEditorPage from "./pages/lessons/LessonEditorPage";

import StudentsPage from "./pages/students/StudentsPage";
import SubjectGroupsPage from "./pages/students/SubjectGroupsPage";
import GroupStudentsPage from "./pages/students/GroupStudentsPage";

function App() {
  return (
    <Routes>
      {/* === Главная и логин === */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginOrJoin />} />

      {/* === Главная панель === */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <RoleRoute allowRoles={["ADMIN", "TEACHER", "STUDENT"]}>
              <Layout showHeader={false}>
                <Dashboard />
              </Layout>
            </RoleRoute>
          </PrivateRoute>
        }
      />

      {/* === Предметы === */}
      <Route
        path="/lessons"
        element={
          <PrivateRoute>
            <RoleRoute allowRoles={["ADMIN", "TEACHER", "STUDENT"]}>
              <Layout>
                <LessonsListPage />
              </Layout>
            </RoleRoute>
          </PrivateRoute>
        }
      />

      {/* === Предмет: список модулей === */}
      <Route
        path="/lessons/:subjectId"
        element={
          <PrivateRoute>
            <RoleRoute allowRoles={["ADMIN", "TEACHER", "STUDENT"]}>
              <Layout>
                <SubjectOverviewPage />
              </Layout>
            </RoleRoute>
          </PrivateRoute>
        }
      />

      {/* === Модуль: список уроков === */}
      <Route
        path="/lessons/:subjectId/modules/:moduleId"
        element={
          <PrivateRoute>
            <RoleRoute allowRoles={["ADMIN", "TEACHER", "STUDENT"]}>
              <Layout>
                <ModuleOverviewPage />
              </Layout>
            </RoleRoute>
          </PrivateRoute>
        }
      />

      {/* === Просмотр урока === */}
      <Route
        path="/lessons/view/:lessonId"
        element={
          <PrivateRoute>
            <RoleRoute allowRoles={["ADMIN", "TEACHER", "STUDENT"]}>
              <Layout>
                <LessonContentPage />
              </Layout>
            </RoleRoute>
          </PrivateRoute>
        }
      />

      {/* === Редактор урока === */}
      <Route
        path="/lessons/edit/:id"
        element={
          <PrivateRoute>
            <RoleRoute allowRoles={["ADMIN", "TEACHER"]}>
              <Layout>
                <LessonEditorPage />
              </Layout>
            </RoleRoute>
          </PrivateRoute>
        }
      />

      {/* === Комнаты === */}
      <Route
        path="/rooms"
        element={
          <PrivateRoute>
            <RoleRoute allowRoles={["ADMIN", "TEACHER", "STUDENT"]}>
              <Layout>
                <RoomJoin />
              </Layout>
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/rooms/:code"
        element={
          <PrivateRoute>
            <RoleRoute allowRoles={["ADMIN", "TEACHER", "STUDENT", "GUEST"]}>
              <Layout>
                <RoomPage />
              </Layout>
            </RoleRoute>
          </PrivateRoute>
        }
      />

      {/* === Профиль === */}
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <RoleRoute allowRoles={["ADMIN", "TEACHER", "STUDENT"]}>
              <Layout>
                <ProfilePage />
              </Layout>
            </RoleRoute>
          </PrivateRoute>
        }
      />

      {/* === Учащиеся === */}
<Route
  path="/students"
  element={
    <PrivateRoute>
      <RoleRoute allowRoles={["ADMIN", "TEACHER"]}>
        <Layout>
          <StudentsPage />
        </Layout>
      </RoleRoute>
    </PrivateRoute>
  }
/>

<Route
  path="/students/:subjectId"
  element={
    <PrivateRoute>
      <RoleRoute allowRoles={["ADMIN", "TEACHER"]}>
        <Layout>
          <SubjectGroupsPage />
        </Layout>
      </RoleRoute>
    </PrivateRoute>
  }
/>

<Route
  path="/students/:subjectId/:groupId"
  element={
    <PrivateRoute>
      <RoleRoute allowRoles={["ADMIN", "TEACHER"]}>
        <Layout>
          <GroupStudentsPage />
        </Layout>
      </RoleRoute>
    </PrivateRoute>
  }
/>

      {/* === 404 === */}
      <Route
        path="*"
        element={
          <Layout>
            <div className="p-4">Страница не найдена</div>
          </Layout>
        }
      />
    </Routes>
  );
}

export default App;
