import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import UserLayout from '../layouts/Layout';
import { useNavigate } from 'react-router-dom';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [userLevel, setUserLevel] = useState('');
  const containerRef = useRef();
  const navigate = useNavigate();

  // 学历等级顺序
  const educationOrder = ['primary', 'middle', 'high', 'bachelor', 'master', 'phd'];
  // 计算当前用户可见的学历等级参数
  const getEducationLevelsParam = (level) => {
    const idx = educationOrder.indexOf(level);
    if (idx === -1) return '';
    return educationOrder.slice(0, idx + 1).join(',');
  };

  useEffect(() => {
    // 获取用户学历等级
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await axios.get('/users/profile/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserLevel(res.data.education_level);
      } catch {}
    };
    fetchUser();
  }, []);

  const handleSearch = async (q) => {
    if (!q || !userLevel) {
      setVideos([]);
      return;
    }
    const educationLevelsParam = getEducationLevelsParam(userLevel);
    const res = await axios.get('http://127.0.0.1:8000/videos/', {
      params: { search: q, education_level: educationLevelsParam, ordering: '-created_at' }
    });
    setVideos(res.data.results || []);
  };

  // 输入框内容变化时自动搜索
  useEffect(() => {
    if (query !== '' && userLevel) {
      handleSearch(query);
    } else {
      setVideos([]);
    }
    // eslint-disable-next-line
  }, [query, userLevel]);

  const styles = {
    container: {
      maxWidth: 600,
      minHeight: 600, // 与推荐页保持一致
      margin: '32px auto',
      background: '#fff',
      borderRadius: 8,
      padding: 24,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    },
    searchBox: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: 26,
      marginTop: 26,
      gap: 8,
      justifyContent: 'center'
    },
    input: {
      width: 480, // 缩小宽度
      height: 48, // 增大高度
      padding: '0 16px',
      borderRadius: 8,
      border: '1px solid #ccc',
      fontSize: 18,
      boxSizing: 'border-box'
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

  return (
    <UserLayout>
      <div ref={containerRef} style={styles.container}>
        {/* 搜索框 */}
        <div style={styles.searchBox}>
          <input
            style={styles.input}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="输入视频标题关键词"
          />
        </div>
        {/* 搜索结果 */}
        {videos.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 100, fontSize: 18, color: '#888' }}>暂无搜索结果</div>
        )}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {videos.map((v, idx) => (
            <li
              key={v.id}
              style={{
                marginBottom: 24,
                padding: 16,
                borderRadius: 8,
                background: '#f7f8fa',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              onClick={() => navigate(`/videos/detail/${v.id}`)}
            >
              <img
                src={v.teacher_avatar && v.teacher_avatar.startsWith('http')
                  ? v.teacher_avatar
                  : (v.teacher_avatar
                      ? `${v.teacher_avatar.startsWith('/') ? '' : '/'}${v.teacher_avatar}`
                      : '/logo192.png')}
                alt="avatar"
                style={{ width: 36, height: 36, borderRadius: '50%', marginRight: 16, objectFit: 'cover', background: '#eee' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: 16 }}>{v.title}</div>
                <div style={{ color: '#888', fontSize: 13, margin: '4px 0' }}>{v.description}</div>
                <div style={{ color: '#aaa', fontSize: 12 }}>{v.teacher_name}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div style={{
        position: 'fixed', bottom: 0, left: 0, width: '100%',
        background: '#fff', borderTop: '1px solid #eee',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: 56, zIndex: 1000
      }}>
        {navs.map((nav) => (
          <button
            key={nav.path}
            onClick={() => navigate(nav.path)}
            style={{
              background:
                (nav.path === '/search' && currentPath === '/search') ||
                (nav.path !== '/search' && currentPath.startsWith(nav.path))
                  ? '#1890ff'
                  : 'none',
              color:
                (nav.path === '/search' && currentPath === '/search') ||
                (nav.path !== '/search' && currentPath.startsWith(nav.path))
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

export default SearchPage;