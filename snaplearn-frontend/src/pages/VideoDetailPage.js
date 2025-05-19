import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserLayout from '../layouts/Layout';

function VideoDetailPage() {
  const [videos, setVideos] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [subject, setSubject] = useState('全部');
  const [userLevel, setUserLevel] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();
  const allSubjects = ['全部', '语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'];
  const [subjects, setSubjects] = useState(allSubjects);
  const containerRef = useRef();
  const subjectBarRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [scrollStartX, setScrollStartX] = useState(0);

  // 学历等级顺序
  const educationOrder = ['primary', 'middle', 'high', 'bachelor', 'master', 'phd'];

  // 计算当前用户可见的学历等级参数
  const getEducationLevelsParam = (level) => {
    const idx = educationOrder.indexOf(level);
    if (idx === -1) return '';
    // 本科及以上用户可见所有 <= 本科的内容
    return educationOrder.slice(0, idx + 1).join(',');
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await axios.get('http://127.0.0.1:8000/users/profile/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserLevel(res.data.education_level);
        setCurrentUserId(res.data.id);
      } catch {}
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!userLevel) return;
    // 计算学历等级筛选条件
    const educationLevelsParam = getEducationLevelsParam(userLevel);
    axios.get('http://127.0.0.1:8000/videos/', {
      params: {
        education_level: educationLevelsParam,
        subject: subject === '全部' ? '' : subject,
        ordering: '-created_at'
      }
    }).then(res => {
      const results = res.data.results || [];
      setVideos(results);
      if (results.length > 0) {
        setCurrentIdx(Math.floor(Math.random() * results.length));
      } else {
        setCurrentIdx(0);
      }
    }).catch(err => {
      setVideos([]);
      setCurrentIdx(0);
    });
  }, [userLevel, subject]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !videos.length) return;
    axios.get('http://localhost:8000/users/teachers/following/', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setIsFollowing(res.data.following_teachers.some(t => t.id === videos[currentIdx].teacher_id));
    }).catch(err => {
      if (err.response && err.response.status === 403) {
        alert('请先登录，或您的登录已过期。');
      }
    });
  }, [videos, currentIdx]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !videos.length) return;
    const videoId = videos[currentIdx].id;
    axios.get('http://localhost:8000/videos/favorites/', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setIsFavorite((res.data.results || []).some(v => v.id === videoId));
    });
  }, [videos, currentIdx]);

  const handleFollow = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const teacher_id = videos[currentIdx].teacher_id;
    if (isFollowing) {
      await axios.delete('http://localhost:8000/users/teachers/following/', {
        headers: { Authorization: `Bearer ${token}` },
        data: { teacher_id }
      });
      setIsFollowing(false);
    } else {
      await axios.post('http://localhost:8000/users/teachers/following/', { teacher_id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsFollowing(true);
    }
  };

  const handleFavorite = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const videoId = videos[currentIdx].id;
    if (isFavorite) {
      await axios.delete(`http://localhost:8000/videos/favorites/`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { video_id: videoId }
      });
      setIsFavorite(false);
    } else {
      await axios.post(`http://localhost:8000/videos/favorites/`, { video_id: videoId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsFavorite(true);
    }
  };

  useEffect(() => {
    const handleWheel = (e) => {
      if (e.deltaY > 0 && currentIdx < videos.length - 1) setCurrentIdx(i => i + 1);
      if (e.deltaY < 0 && currentIdx > 0) setCurrentIdx(i => i - 1);
    };
    const node = containerRef.current;
    if (node) node.addEventListener('wheel', handleWheel);
    return () => { if (node) node.removeEventListener('wheel', handleWheel); };
  }, [currentIdx, videos.length]);

  useEffect(() => {
    const bar = subjectBarRef.current;
    if (!bar) return;
    const handleMouseMove = (e) => {
      if (!dragging) return;
      bar.scrollLeft = scrollStartX - (e.clientX - dragStartX);
    };
    const handleMouseUp = () => setDragging(false);
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, dragStartX, scrollStartX]);

  useEffect(() => {
    const bar = subjectBarRef.current;
    if (!bar) return;
    const btns = bar.querySelectorAll('button');
    const idx = subjects.indexOf(subject);
    if (idx === -1) return;
    const btn = btns[idx];
    if (!btn) return;
    const barRect = bar.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const offset = btnRect.left - barRect.left - (barRect.width / 2) + (btnRect.width / 2);
    bar.scrollLeft += offset;
  }, [subject, subjects]);

  useEffect(() => {
    // 拉取所有有视频的学科时也用学历等级范围
    if (!userLevel) return;
    const educationLevelsParam = getEducationLevelsParam(userLevel);
    axios.get('http://127.0.0.1:8000/videos/', {
      params: {
        education_level: educationLevelsParam,
        ordering: '-created_at'
      }
    }).then(res => {
      const results = res.data.results || [];
      const subjectSet = new Set();
      results.forEach(v => {
        if (v.subject && v.subject.trim()) subjectSet.add(v.subject);
      });
      // 只显示当前学历等级范围内实际有视频的学科
      const filteredSubjects = ['全部', ...allSubjects.filter(s => s !== '全部' && subjectSet.has(s))];
      setSubjects(filteredSubjects);
      if (subject !== '全部' && !subjectSet.has(subject)) {
        setSubject('全部');
      }
    });
  }, [userLevel]);

  const styles = {
    container: {
      maxWidth: 600,
      minHeight: 600, // 保证无视频时高度一致
      margin: '32px auto',
      background: '#fff',
      borderRadius: 8,
      padding: 24,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }
  };

  // 修复：防止 currentIdx 越界或 video 为 undefined
  const video = videos[currentIdx] || {};

  // 判断当前视频是否为本人上传
  const isSelfVideo = !!currentUserId && !!video && String(video.teacher_id) === String(currentUserId);

  // 新增：底部导航按钮高亮逻辑
  const currentPath = window.location.pathname;
  const navs = [
    { label: '推荐', path: '/videos' },
    { label: '收藏', path: '/favorites' },
    { label: '关注', path: '/teachers' },
    { label: '搜索', path: '/search' },
  ];

  // 不管有无视频都渲染 container 和底部导航
  return (
    <UserLayout>
      <div style={styles.container}>
        {/* 学科分类条 */}
        <div
          ref={subjectBarRef}
          style={{
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            margin: 8,
            cursor: dragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            paddingBottom: 0,
            borderBottom: 'none',
            boxShadow: 'none',
            background: 'transparent',
            width: '100%',
            maxWidth: '100vw',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          onMouseDown={e => {
            setDragging(true);
            setDragStartX(e.clientX);
            setScrollStartX(subjectBarRef.current.scrollLeft);
          }}
          onMouseLeave={() => setDragging(false)}
          onMouseUp={() => setDragging(false)}
        >
          {subjects.map(s => (
            <span
              key={s}
              style={{
                display: 'inline-block',
                marginRight: 8,
                background: subject === s ? '#1890ff' : '#eee',
                color: subject === s ? '#fff' : '#333',
                borderRadius: 4,
                padding: '6px 16px',
                fontWeight: subject === s ? 'bold' : 'normal',
                outline: 'none',
                cursor: 'pointer',
                userSelect: 'none',
                border: 'none',
                boxShadow: 'none',
                transition: 'background 0.2s, color 0.2s'
              }}
              onClick={() => setSubject(s)}
            >
              {s}
            </span>
          ))}
          <style>
            {`
              [data-hide-scrollbar]::-webkit-scrollbar { display: none; }
            `}
          </style>
        </div>
        {/* 主体内容 */}
        {videos.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 100, fontSize: 18, color: '#888' }}>暂无视频</div>
        ) : (
          <>
            {/* 用户头像和用户名，移动到视频标题上方 */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0 8px 0', paddingLeft: 0 }}>
              <img
                src={
                  video.teacher_avatar && video.teacher_avatar.startsWith('http')
                    ? video.teacher_avatar
                    : (video.teacher_avatar
                        ? `${video.teacher_avatar.startsWith('/') ? '' : '/'}${video.teacher_avatar}`
                        : '/logo192.png')
                }
                alt="avatar"
                style={{ width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', marginRight: 12 }}
                onClick={() => video.teacher_id && navigate(`/videos/${video.teacher_id}`)}
              />
              <span style={{ fontWeight: 'bold', fontSize: 17, marginRight: 12 }}>{video.teacher_name}</span>
              {/* 只显示关注按钮给非本人，且当前用户已登录，且有teacher_id */}
              {currentUserId && !isSelfVideo && video.teacher_id && (
                <button
                  style={{
                    marginRight: 12,
                    background: isFollowing ? '#ccc' : '#1890ff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '6px 16px'
                  }}
                  onClick={handleFollow}
                >
                  {isFollowing ? '已关注' : '关注'}
                </button>
              )}
            </div>
            {/* 视频窗口 */}
            <video controls src={video.video_url} style={{ width: '100%', maxHeight: 400, background: '#000', display: 'block' }} />
            {/* 视频名称和简介，收藏按钮在标题后面，且不能收藏自己 */}
            <div style={{ margin: '12px 0 0 0', textAlign: 'left', display: 'flex', alignItems: 'flex-start' }}>
              <div style={{ fontWeight: 'bold', fontSize: 18, marginTop: 20, lineHeight: '32px' }}>
                标题：{video.title}
              </div>
              {/* 只显示收藏按钮给非本人，且当前用户已登录，且有video.id */}
              {currentUserId && !isSelfVideo && video.id && (
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 22,
                    color: isFavorite ? '#ffb400' : '#bbb',
                    padding: 0,
                    marginLeft: 8,
                    marginTop: 20,
                    height: 32,
                    lineHeight: '32px',
                    outline: 'none',
                    display: 'inline-block',
                    verticalAlign: 'top'
                  }}
                  onClick={handleFavorite}
                  title={isFavorite ? '取消收藏' : '收藏'}
                >
                  {isFavorite ? '★' : '☆'}
                </button>
              )}
            </div>
            <div style={{ fontSize: 14, color: '#888', marginTop: 20, textAlign: 'left' }}>简介：{video.description}</div>
          </>
        )}
      </div>
      {/* 页脚导航栏 */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, width: '100%',
        background: '#fff', borderTop: '1px solid #eee',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: 56, zIndex: 1000
      }}>
        {navs.map((nav, idx) => (
          <button
            key={nav.path}
            onClick={() => navigate(nav.path)}
            style={{
              background:
                (nav.path === '/videos' && currentPath === '/videos') ||
                (nav.path !== '/videos' && currentPath.startsWith(nav.path))
                  ? '#1890ff'
                  : 'none',
              color:
                (nav.path === '/videos' && currentPath === '/videos') ||
                (nav.path !== '/videos' && currentPath.startsWith(nav.path))
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

export default VideoDetailPage;