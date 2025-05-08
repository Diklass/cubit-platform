import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './auth/PrivateRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LessonsList from './pages/LessonsList';
import { RoomJoin } from './pages/RoomJoin';
import { RoomPage } from './pages/RoomPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>}
      />
      <Route
        path="/lessons"
        element={<PrivateRoute><Layout><LessonsList /></Layout></PrivateRoute>}
      />
      <Route
        path="/rooms"
        element={<PrivateRoute><Layout><RoomJoin /></Layout></PrivateRoute>}
      />
      <Route
        path="/rooms/:code"
        element={<PrivateRoute><Layout><RoomPage /></Layout></PrivateRoute>}
      />
      <Route
        path="/profile"
        element={<PrivateRoute><Layout><ProfilePage /></Layout></PrivateRoute>}
      />

      <Route path="*" element={<Layout><div className="p-4">Страница не найдена</div></Layout>} />
    </Routes>
  );
}

export default App;
