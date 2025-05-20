import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import UserLayout from '../layouts/Layout';
import { useNavigate } from 'react-router-dom';

function FavoriteVideosPage() {
  const [favorites, setFavorites] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [homework, setHomework] = useState(null);
  const [homeworkId, setHomeworkId] = useState(null);
  const containerRef = useRef();
  const detailRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/videos/favorites/', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }).then((response) => {
      const sorted = (response.data.results || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setFavorites(sorted);
      setCurrentIdx(0);
    });
  }, []);

  // 当选中视频时拉取作业内容
  useEffect(() => {
    if (!selectedVideo) {
      setHomework(null);
      setHomeworkId(null);
      return;
    }
    axios.get(`http://127.0.0.1:8000/videos/${selectedVideo.id}/homework/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(res => {
      if (res.data && Array.isArray(res.data.questions) && res.data.questions.length > 0) {
        setHomework(res.data);
        // 拉取 homework_id（需后端返回 id 字段，若无可通过其它接口查找）
        if (res.data.id) setHomeworkId(res.data.id);
        else setHomeworkId(null);
      } else {
        setHomework(null);
        setHomeworkId(null);
      }
    }).catch(() => {
      setHomework(null);
      setHomeworkId(null);
    });
  }, [selectedVideo]);

  // 放大播放时支持滚轮切换
  useEffect(() => {
    if (!showDetail) return;
    const handleWheel = (e) => {
      if (e.deltaY > 0 && currentIdx < favorites.length - 1) setCurrentIdx(i => i + 1);
      if (e.deltaY < 0 && currentIdx > 0) setCurrentIdx(i => i - 1);
    };
    const node = detailRef.current;
    if (node) node.addEventListener('wheel', handleWheel);
    return () => { if (node) node.removeEventListener('wheel', handleWheel); };
  }, [showDetail, currentIdx, favorites.length]);

  const styles = {
    container: {
      maxWidth: 600,
      minHeight: 600,
      margin: '32px auto',
      background: '#fff',
      borderRadius: 8,
      padding: 24,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
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
    },
    likeBar: {
      position: 'absolute',
      left: 0,
      bottom: 0,
      width: '100%',
      background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
      color: '#fff',
      fontSize: 15,
      display: 'flex',
      alignItems: 'center',
      padding: '0 8px 6px 8px',
      height: 32,
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

  // 数字格式化
  const formatCount = n => {
    if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万';
    return n;
  };

  if (!favorites.length) {
    return (
      <UserLayout>
        <div style={styles.container}>
          <div style={{ textAlign: 'center', marginTop: 100, fontSize: 18, color: '#888' }}>暂未收藏视频</div>
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
                  (nav.path === '/favorites' && currentPath === '/favorites') ||
                  (nav.path !== '/favorites' && currentPath.startsWith(nav.path))
                    ? '#1890ff'
                    : 'none',
                color:
                  (nav.path === '/favorites' && currentPath === '/favorites') ||
                  (nav.path !== '/favorites' && currentPath.startsWith(nav.path))
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

  const video = favorites[currentIdx];

  return (
    <UserLayout>
      <div ref={containerRef} style={styles.container}>
        {/* 缩略图网格 */}
        {!showDetail && (
          <div style={styles.grid}>
            {favorites.map((item, idx) => (
              <div
                key={item.id || idx}
                style={styles.thumbBox(false)}
                onClick={() => { setCurrentIdx(idx); setShowDetail(true); setSelectedVideo(item); }}
              >
                <img
                  src={item.thumbnail_url || '/default-thumb.png'}
                  alt={item.title}
                  style={styles.thumbImg}
                />
                <span style={styles.playIcon}>▶</span>
                <div style={styles.likeBar}>
                  <span style={{ marginRight: 6, fontSize: 17, verticalAlign: 'middle' }}>♡</span>
                  <span>{formatCount(item.like_count || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 放大播放详情页 */}
        {showDetail && (
          <div ref={detailRef}>
            {/* 关闭按钮 */}
            <button
              onClick={() => { setShowDetail(false); setSelectedVideo(null); }}
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
            {/* 视频作者信息 */}
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
            </div>
            {/* 视频窗口 */}
            <video controls src={video.video_url} style={{ width: '100%', maxHeight: 400, background: '#000', display: 'block', borderRadius: 8 }} />
            {/* 视频名称和简介 */}
            <div style={{ margin: '12px 0 0 0', textAlign: 'left', display: 'flex', alignItems: 'flex-start' }}>
              <div style={{ fontWeight: 'bold', fontSize: 18, marginTop: 20, lineHeight: '32px' }}>
                标题：{video.title}
              </div>
            </div>
            <div style={{ fontSize: 14, color: '#888', marginTop: 20, textAlign: 'left' }}>简介：{video.description}</div>
            {/* 作业展示 */}
            {homework && (
              <div style={{ marginTop: 32, border: '1px solid #eee', borderRadius: 8, padding: 18 }}>
                <h3>作业：{homework.title}</h3>
                <div style={{ marginBottom: 12, color: '#888' }}>{homework.description}</div>
                {homework.questions.map((q, idx) => (
                  <div key={idx} style={{ marginBottom: 18, padding: 12, background: '#fafbfc', borderRadius: 6 }}>
                    <div><b>题目{idx + 1} [{q.question_type === 'single' ? '单选' : q.question_type === 'multiple' ? '多选' : '主观'}]</b></div>
                    <div style={{ margin: '8px 0' }}>{q.text}</div>
                    {(q.question_type === 'single' || q.question_type === 'multiple') && Array.isArray(q.options) && (
                      <ul>
                        {q.options.map((opt, oIdx) => (
                          <li key={oIdx}>{String.fromCharCode(65 + oIdx)}. {opt}</li>
                        ))}
                      </ul>
                    )}
                    <div style={{ color: '#888', fontSize: 13 }}>分值：{q.score}</div>
                  </div>
                ))}
                {/* 去做作业按钮 */}
                {homeworkId && (
                  <button
                    style={{
                      marginTop: 16,
                      background: '#1890ff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      padding: '10px 32px',
                      fontWeight: 'bold',
                      fontSize: 16,
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/homework/do/${homeworkId}`)}
                  >
                    去做作业
                  </button>
                )}
              </div>
            )}
          </div>
        )}
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
                (nav.path === '/favorites' && currentPath === '/favorites') ||
                (nav.path !== '/favorites' && currentPath.startsWith(nav.path))
                  ? '#1890ff'
                  : 'none',
              color:
                (nav.path === '/favorites' && currentPath === '/favorites') ||
                (nav.path !== '/favorites' && currentPath.startsWith(nav.path))
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

export default FavoriteVideosPage;