import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import UserLayout from '../layouts/Layout';
import { useNavigate } from 'react-router-dom';

function TeacherPage() {
  const [teachers, setTeachers] = useState([]);
  const containerRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/users/teachers/following/', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }).then((response) => {
      setTeachers((response.data.following_teachers || []).slice().reverse());
    });
  }, []);

  const [currentIdx, setCurrentIdx] = useState(0);
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.deltaY > 0 && currentIdx < teachers.length - 1) setCurrentIdx(i => i + 1);
      if (e.deltaY < 0 && currentIdx > 0) setCurrentIdx(i => i - 1);
    };
    const node = containerRef.current;
    if (node) node.addEventListener('wheel', handleWheel);
    return () => { if (node) node.removeEventListener('wheel', handleWheel); };
  }, [currentIdx, teachers.length]);

  const handleUnfollow = async (teacherId) => {
    await axios.delete('http://localhost:8000/users/teachers/following/', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      data: { teacher_id: teacherId }
    });
    setTeachers(ts => ts.filter(t => t.id !== teacherId));
    setCurrentIdx(i => (i > 0 && i >= teachers.length - 1 ? i - 1 : i));
  };

  const styles = {
    container: {
      maxWidth: 600,
      minHeight: 600, // 与推荐页保持一致
      margin: '32px auto',
      background: '#fff',
      borderRadius: 8,
      padding: 24,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }
  };

  // 页脚导航栏
  const currentPath = window.location.pathname;
  const navs = [
    { label: '推荐', path: '/videos' },
    { label: '收藏', path: '/favorites' },
    { label: '关注', path: '/teachers' },
    { label: '搜索', path: '/search' },
  ];

  if (!teachers.length) {
    return (
      <UserLayout>
        <div style={styles.container}>
          <div style={{ textAlign: 'center', marginTop: 100, fontSize: 18, color: '#888' }}>暂无关注用户</div>
        </div>
        <div style={{
          position: 'fixed', bottom: 0, left: 0, width: '100%',
          background: '#fff', borderTop: '1px solid #eee',
          display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: 56, zIndex: 1000
        }}>
          {navs.map((nav) => (
            <button
              key={nav.path}
              onClick={() => window.location.pathname !== nav.path && window.location.assign(nav.path)}
              style={{
                background:
                  (nav.path === '/teachers' && currentPath === '/teachers') ||
                  (nav.path !== '/teachers' && currentPath.startsWith(nav.path))
                    ? '#1890ff'
                    : 'none',
                color:
                  (nav.path === '/teachers' && currentPath === '/teachers') ||
                  (nav.path !== '/teachers' && currentPath.startsWith(nav.path))
                    ? '#fff'
                    : '#333',
                border: 'none',
                fontSize: 16,
                flex: 1,
                height: '100%',
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s'
              }}
            >
              {nav.label}
            </button>
          ))}
        </div>
      </UserLayout>
    );
  }

  const teacher = teachers[currentIdx];

  return (
    <UserLayout>
      <div ref={containerRef} style={styles.container}>
        <div style={{ marginBottom: 16, color: '#888' }}>
          {teachers.length > 1 && (
            <span>
              用户 {currentIdx + 1} / {teachers.length}
            </span>
          )}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '18px 0',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <img
            src={
              teacher.avatar_url && teacher.avatar_url.startsWith('http')
                ? teacher.avatar_url
                : (teacher.avatar_url
                    ? `${teacher.avatar_url.startsWith('/') ? '' : '/'}${teacher.avatar_url}`
                    : '/logo192.png')
            }
            alt="avatar"
            style={{ width: 48, height: 48, borderRadius: '50%', marginRight: 16, objectFit: 'cover', background: '#eee', cursor: 'pointer' }}
            onClick={() => navigate(`/videos/${teacher.id}`)}
          />
          <span style={{ fontWeight: 'bold', fontSize: 17, flex: 1 }}>{teacher.username}</span>
          <button
            style={{
              background: '#ccc',
              color: '#333',
              border: 'none',
              borderRadius: 4,
              padding: '6px 18px',
              fontWeight: 'bold',
              fontSize: 15,
              marginLeft: 12,
              cursor: 'pointer'
            }}
            onClick={() => handleUnfollow(teacher.id)}
          >
            已关注
          </button>
        </div>
      </div>
      <div style={{
        position: 'fixed', bottom: 0, left: 0, width: '100%',
        background: '#fff', borderTop: '1px solid #eee',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: 56, zIndex: 1000
      }}>
        {navs.map((nav) => (
          <button
            key={nav.path}
            onClick={() => window.location.pathname !== nav.path && window.location.assign(nav.path)}
            style={{
              background:
                (nav.path === '/teachers' && currentPath === '/teachers') ||
                (nav.path !== '/teachers' && currentPath.startsWith(nav.path))
                  ? '#1890ff'
                  : 'none',
              color:
                (nav.path === '/teachers' && currentPath === '/teachers') ||
                (nav.path !== '/teachers' && currentPath.startsWith(nav.path))
                  ? '#fff'
                  : '#333',
              border: 'none',
              fontSize: 16,
              flex: 1,
              height: '100%',
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s'
            }}
          >
            {nav.label}
          </button>
        ))}
      </div>
    </UserLayout>
  );
}

export default TeacherPage;