import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'; // 添加 Navigate
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VideoListPage from './pages/VideoListPage';
import VideoDetailPage from './pages/VideoDetailPage';
import UploadContentPage from './pages/UploadContentPage';
import ManageContentPage from './pages/ManageContentPage';
import SearchPage from './pages/SearchPage';
import TeacherPage from './pages/TeacherPage';
import FavoriteVideosPage from './pages/FavoriteVideosPage';
import ProfilePage from './pages/ProfilePage'; // 导入用户个人资料页面
import AdminPage from './pages/AdminPage'; // 导入管理员页面
import ProtectedRoute from './components/ProtectedRoute'; // 导入受保护路由组件
import UserLayout from './layouts/Layout';

function App() {
  // 检查用户是否已登录
  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        {/* 根路径默认跳转到 /login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* 公共模块 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 受保护的路由 */}
        <Route
          path="/videos"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <VideoDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/videos/:teacherId"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <VideoListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/videos/detail/:id"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <VideoDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <SearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <TeacherPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <FavoriteVideosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <UploadContentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/uploadcontentpage"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <UploadContentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <ManageContentPage />
            </ProtectedRoute>
          }
        />

        {/* 用户个人资料页面 */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* 管理员页面 */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;