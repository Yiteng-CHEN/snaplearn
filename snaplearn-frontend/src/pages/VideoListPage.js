import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../layouts/Layout';

function VideoListPage() {
  const { teacherId } = useParams();
  const [videos, setVideos] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();
  const containerRef = useRef();
  const detailRef = useRef();

  useEffect(() => {
    // 拉取当前用户 id
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:8000/users/profile/', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setCurrentUserId(res.data.id);
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    axios.get('http://localhost:8000/videos/?teacher_id=' + teacherId + '&ordering=-created_at')
      .then(res => {
        setVideos(res.data.results || []);
        setCurrentIdx(0);
        if (res.data.results && res.data.results.length > 0) {
          setTeacherName(res.data.results[0].teacher_name);
        }
      });
    // 检查是否已关注
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:8000/users/teachers/following/', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setIsFollowing(res.data.following_teachers.some(t => t.id === Number(teacherId)));
      });
    }
  }, [teacherId]);

  const handleFollow = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (isFollowing) {
      await axios.delete('http://localhost:8000/users/teachers/following/', {
        headers: { Authorization: `Bearer ${token}` },
        data: { teacher_id: teacherId }
      });
      setIsFollowing(false);
    } else {
      await axios.post('http://localhost:8000/users/teachers/following/', { teacher_id: teacherId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsFollowing(true);
    }
  };

  // 支持放大播放时滚轮切换
  useEffect(() => {
    if (!showDetail) return;
    const handleWheel = (e) => {
      if (e.deltaY > 0 && currentIdx < videos.length - 1) setCurrentIdx(i => i + 1);
      if (e.deltaY < 0 && currentIdx > 0) setCurrentIdx(i => i - 1);
    };
    const node = detailRef.current;
    if (node) node.addEventListener('wheel', handleWheel);
    return () => { if (node) node.removeEventListener('wheel', handleWheel); };
  }, [showDetail, currentIdx, videos.length]);

  if (!videos.length) return <div>暂无视频</div>;
  const video = videos[currentIdx];

  // 新增样式，与 FavoriteVideosPage 保持一致
  const styles = {
    container: {
      maxWidth: 600,
      margin: '32px auto',
      background: '#fff',
      borderRadius: 8,
      padding: 24,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      minHeight: 600 // 64 约等于顶部和底部导航高度
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 12,
      marginBottom: 24
    },
    thumbBox: isActive => ({
      width: '100%',
      aspectRatio: '1/1',
      background: '#eee',
      borderRadius: 8,
      overflow: 'hidden',
      border: isActive ? '2px solid #1890ff' : '2px solid transparent',
      cursor: 'pointer',
      position: 'relative',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end'
    }),
    thumbImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block',
      position: 'absolute',
      left: 0,
      top: 0
    },
    playIcon: {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: 32,
      color: 'rgba(255,255,255,0.8)',
      pointerEvents: 'none'
    }
  };

  // 新增：底部导航按钮高亮逻辑，保持与 VideoDetailPage 一致
  const currentPath = window.location.pathname;
  const navs = [
    { label: '推荐', path: '/videos' },
    { label: '收藏', path: '/favorites' },
    { label: '关注', path: '/teachers' },
    { label: '搜索', path: '/search' },
  ];

  return (
    <Layout>
      <div ref={containerRef} style={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          {/* 头像放在用户名前面，使用 teacher_avatar 字段 */}
          <img
            src={
              video.teacher_avatar && video.teacher_avatar.startsWith('http')
                ? video.teacher_avatar
                : (video.teacher_avatar
                    ? `${video.teacher_avatar.startsWith('/') ? '' : '/'}${video.teacher_avatar}`
                    : '/logo192.png')
            }
            alt="avatar"
            //头像样式
            style={{ width: 60, height: 60, borderRadius: '50%', marginRight: 12, objectFit: 'cover', cursor: 'pointer' }}
            onClick={() => {
              // 如果在详情页，点击头像返回列表模式
              if (showDetail) setShowDetail(false);
              else navigate(`/videos/${video.teacher_id}`);
            }}
          />
          <div style={{ fontWeight: 'bold', fontSize: 22 }}>{teacherName}</div>
          {/* 仅非本人时显示关注按钮 */}
          {currentUserId && String(video.teacher_id) !== String(currentUserId) && (
            <button
              style={{
                marginLeft: 16,
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
        <hr style={{ margin: '16px 0', border: 'none', borderTop: '2px solid #eee' }} />
        {/* 视频缩略图网格 */}
        {!showDetail && (
          <div style={styles.grid}>
            {videos.map((item, idx) => (
              <div
                key={item.id || idx}
                style={styles.thumbBox(false)}
                onClick={() => { setCurrentIdx(idx); setShowDetail(true); }}
              >
                <img
                  src={item.thumbnail_url || '/default-thumb.png'}
                  alt={item.title}
                  style={styles.thumbImg}
                />
                <span style={styles.playIcon}>▶</span>
              </div>
            ))}
          </div>
        )}
        {/* 放大播放详情页 */}
        {showDetail && (
          <div ref={detailRef}>
            {/* 关闭按钮 */}
            <button
              onClick={() => setShowDetail(false)}
              style={{
                position: 'absolute',
                right: 36,
                top: 36,
                zIndex: 10,
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 36,
                height: 36,
                fontSize: 22,
                cursor: 'pointer'
              }}
              title="关闭"
            >×</button>
            {/* 视频窗口 */}
            <video controls src={video.video_url} style={{ width: '100%', maxHeight: 400, background: '#000', display: 'block', borderRadius: 8 }} />
            {/* 视频名称和简介 */}
            <div style={{ margin: '12px 0 0 0', textAlign: 'left', display: 'flex', alignItems: 'flex-start' }}>
              <div style={{ fontWeight: 'bold', fontSize: 18, marginTop: 20, lineHeight: '32px' }}>
                标题：{video.title}
              </div>
            </div>
            <div style={{ fontSize: 14, color: '#888', marginTop: 20, textAlign: 'left' }}>简介：{video.description}</div>
          </div>
        )}
      </div>
      {/* 页脚导航栏，样式与 VideoDetailPage 保持一致 */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        background: '#fff',
        borderTop: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 56,
        zIndex: 1000
      }}>
        {navs.map((nav) => (
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
    </Layout>
  );
}

export default VideoListPage;