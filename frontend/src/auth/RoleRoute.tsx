import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

type RoleRouteProps = {
  children: React.ReactNode;
  allowRoles: Array<'ADMIN' | 'TEACHER' | 'STUDENT' | 'GUEST'>;
};

/**
 * Ограничивает доступ к маршруту: 
 * если у пользователя нет роли в allowRoles — перенаправляет на /login.
 */
export const RoleRoute: React.FC<RoleRouteProps> = ({ children, allowRoles }) => {
  const { user } = useAuth();
  const location = useLocation();

  // если вообще не залогинен
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // если роль не в списке разрешённых
  if (!allowRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
