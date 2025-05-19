import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ isLoggedIn, children }) => {
  // 如果用户未登录，重定向到登录页面
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  // 如果用户已登录，渲染子组件
  return children;
};

export default ProtectedRoute;