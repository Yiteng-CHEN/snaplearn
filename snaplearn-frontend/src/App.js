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
import DoHomework from './pages/DoHomework'; // 导入作业答题页面
import MistakeReviewBook from './pages/MistakeReviewBook';
import CheckHomework from './pages/CheckHomework';
import CheckHomeworkStudents from './pages/CheckHomeworkStudents';
import CheckHomeworkDetail from './pages/CheckHomeworkDetail';
// 新增
import ScoreQueryPage from './pages/ScoreQueryPage';

function App() {
  // 检查用户是否已登录
  const isLoggedIn = !!localStorage.getItem('token');
  const [checkState, setCheckState] = React.useState({ step: 0, homeworkId: null, studentId: null });

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
        {/* 新增：作业答题页面 */}
        <Route
          path="/homework/do/:videoId"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <DoHomework />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dohomework/:videoId"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <DoHomework />
            </ProtectedRoute>
          }
        />
        <Route path="/mistakebook" element={<MistakeReviewBook />} />
        <Route path="/checkhomework" element={
          checkState.step === 0 ? (
            <CheckHomework onSelectHomework={id => setCheckState({ step: 1, homeworkId: id })} />
          ) : checkState.step === 1 ? (
            <CheckHomeworkStudents
              homeworkId={checkState.homeworkId}
              onSelectStudent={sid => setCheckState({ ...checkState, step: 2, studentId: sid })}
              onBack={() => setCheckState({ step: 0 })}
            />
          ) : (
            <CheckHomeworkDetail
              homeworkId={checkState.homeworkId}
              studentId={checkState.studentId}
              onBack={() => setCheckState({ step: 1, homeworkId: checkState.homeworkId })}
            />
          )
        } />
        <Route path="/scorequery" element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <ScoreQueryPage />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;