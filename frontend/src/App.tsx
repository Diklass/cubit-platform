import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './auth/PrivateRoute';
import Layout from './components/Layout';

import LoginOrJoin from './pages/LoginOrJoin';
import Dashboard from './pages/Dashboard';
import LessonsList from './pages/LessonsList';
import { RoomJoin } from './pages/RoomJoin';
import { RoomPage } from './pages/RoomPage';
import ProfilePage from './pages/ProfilePage';
import { RoleRoute } from './auth/RoleRoute';



function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
       <Route path="/login" element={<LoginOrJoin />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <RoleRoute allowRoles={['ADMIN','TEACHER','STUDENT']}>
              <Layout><Dashboard /></Layout>
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/lessons"
        element={
          <PrivateRoute>
            <RoleRoute allowRoles={['ADMIN','TEACHER','STUDENT']}>
              <Layout><LessonsList /></Layout>
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/rooms"
        element={
          <PrivateRoute>
            <RoleRoute allowRoles={['ADMIN','TEACHER','STUDENT']}>
              <Layout><RoomJoin /></Layout>
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/rooms/:code"
        element={
          <PrivateRoute>
            <RoleRoute allowRoles={['ADMIN','TEACHER','STUDENT','GUEST']}>
              <Layout><RoomPage /></Layout>
            </RoleRoute>
          </PrivateRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <RoleRoute allowRoles={['ADMIN','TEACHER','STUDENT']}>
              <Layout><ProfilePage /></Layout>
            </RoleRoute>
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Layout><div className="p-4">Страница не найдена</div></Layout>} />
    </Routes>
  );
}

export default App;
