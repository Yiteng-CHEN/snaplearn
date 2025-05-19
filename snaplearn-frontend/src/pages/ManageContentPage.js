import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../layouts/Layout';

const SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'];
const LEVELS = [
  { value: 'primary', label: '小学' },
  { value: 'middle', label: '初中' },
  { value: 'high', label: '高中' },
  { value: 'bachelor', label: '本科' },
  { value: 'master', label: '硕士' },
  { value: 'phd', label: '博士' }
];

function ManageContentPage() {
  const [videos, setVideos] = useState([]);
  const [editStates, setEditStates] = useState({});
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/videos/manage/', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setVideos(response.data.videos || []);
        const states = {};
        (response.data.videos || []).forEach(v => {
          states[v.id] = {
            title: v.title,
            description: v.description,
            subject: v.subject || SUBJECTS[0],
            education_level: v.education_level || LEVELS[0].value,
            is_free: v.is_free,
            price: v.price || '',
            changed: false
          };
        });
        setEditStates(states);
      } catch (error) {
        alert('请先登录');
        navigate('/');
      }
    };
    fetchVideos();
  }, [navigate]);

  const isChanged = (video, state) => {
    return (
      video.title !== state.title ||
      video.description !== state.description ||
      (video.subject || SUBJECTS[0]) !== state.subject ||
      (video.education_level || LEVELS[0].value) !== state.education_level ||
      video.is_free !== state.is_free ||
      (video.price || '') !== state.price
    );
  };

  const handleFieldChange = (id, field, value) => {
    setEditStates(prev => {
      const newState = { ...prev[id], [field]: value };
      const video = videos.find(v => v.id === id);
      newState.changed = isChanged(video, newState);
      return { ...prev, [id]: newState };
    });
  };

  const handleEdit = (id) => {
    setEditingId(id);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleSave = async (id) => {
    const state = editStates[id];
    try {
      await axios.post(
        `http://127.0.0.1:8000/videos/${id}/update/`,
        {
          title: state.title,
          description: state.description,
          subject: state.subject,
          education_level: state.education_level,
          is_free: state.is_free,
          price: state.is_free ? null : state.price,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setVideos(videos =>
        videos.map(v =>
          v.id === id
            ? {
                ...v,
                title: state.title,
                description: state.description,
                subject: state.subject,
                education_level: state.education_level,
                is_free: state.is_free,
                price: state.is_free ? null : state.price,
              }
            : v
        )
      );
      setEditStates(prev => ({
        ...prev,
        [id]: { ...prev[id], changed: false }
      }));
      setEditingId(null);
    } catch (error) {
      alert('更新视频信息失败');
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('确定要删除该视频及其所有题目吗？')) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/videos/${videoId}/delete/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setVideos(videos.filter((video) => video.id !== videoId));
      setEditStates(prev => {
        const newStates = { ...prev };
        delete newStates[videoId];
        return newStates;
      });
      if (editingId === videoId) setEditingId(null);
    } catch (error) {
      alert('删除视频失败');
    }
  };

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
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 24,
    },
    card: {
      background: '#fff',
      borderRadius: 8,
      boxShadow: '0 1px 4px rgba(255, 255, 255, 0)',
      padding: 18,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: 200,
      position: 'relative'
    },
    thumb: {
      width: 120,
      height: 90,
      borderRadius: 6,
      objectFit: 'cover',
      background: '#eee',
      marginBottom: 10
    },
    btnRow: {
      display: 'flex',
      gap: 10,
      marginTop: 8
    },
    button: {
      padding: '6px 14px',
      borderRadius: 4,
      border: 'none',
      fontWeight: 'bold',
      fontSize: 14,
      cursor: 'pointer'
    },
    edit: {
      background: '#17a2b8',
      color: '#fff'
    },
    delete: {
      background: '#dc3545',
      color: '#fff'
    },
    save: {
      background: '#52c41a',
      color: '#fff'
    },
    cancel: {
      background: '#eee',
      color: '#333'
    },
    form: {
      width: '100%',
      marginTop: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    },
    label: {
      fontWeight: 'bold',
      marginBottom: 2
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      borderRadius: 4,
      border: '1px solid #ccc',
      fontSize: 16
    },
    textarea: {
      width: '100%',
      minHeight: 60,
      padding: '10px 12px',
      borderRadius: 4,
      border: '1px solid #ccc',
      fontSize: 16,
      resize: 'vertical'
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      borderRadius: 4,
      border: '1px solid #ccc',
      fontSize: 16
    },
    freeRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    },
    actionRow: {
      display: 'flex',
      gap: 16,
      marginTop: 24,
      justifyContent: 'center'
    }
  };

  // 编辑模式：只显示单个视频的表单
  if (editingId) {
    const state = editStates[editingId];
    const video = videos.find(v => v.id === editingId);
    // 仿照上传页面的样式
    const uploadStyles = {
      container: {
        maxWidth: '400px',
        margin: '30px auto',
        padding: '60px',
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
      },
      title: {
        textAlign: 'center',
        marginBottom: '60px',
        fontSize: 24,
        fontWeight: 'bold'
      },
      inputGroup: {
        marginBottom: '15px',
        width: '100%',
      },
      label: {
        display: 'block',
        marginBottom: '5px',
        fontWeight: 'bold',
        fontSize: 16,
      },
      input: {
        width: '100%',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        marginBottom: '10px',
        marginTop: '10px',
        fontSize: 16,
      },
      textarea: {
        width: '100%',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        marginBottom: '10px',
        marginTop: '10px',
        fontSize: 16,
        minHeight: 60,
        resize: 'vertical'
      },
      select: {
        width: '100%',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        marginBottom: '10px',
        marginTop: '10px',
        fontSize: 16,
      },
      freeRow: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 10,
        marginBottom: 10,
      },
      actionRow: {
        width: '100%',
        display: 'flex',
        gap: 16,
        marginTop: 32,
        justifyContent: 'center'
      },
      save: {
        background: '#1890ff',
        color: '#fff',
        border: 'none',
        borderRadius: 4,
        padding: '10px 32px',
        fontWeight: 'bold',
        fontSize: 16,
        cursor: state.changed ? 'pointer' : 'not-allowed',
        opacity: state.changed ? 1 : 0.5,
      },
      cancel: {
        background: '#eee',
        color: '#333',
        border: 'none',
        borderRadius: 4,
        padding: '10px 32px',
        fontWeight: 'bold',
        fontSize: 16,
        cursor: 'pointer'
      }
    };
    return (
      <UserLayout>
        <div style={uploadStyles.container}>
          <div style={uploadStyles.title}>编辑视频信息</div>
          <form
            style={{ width: '100%' }}
            onSubmit={e => {
              e.preventDefault();
              handleSave(editingId);
            }}
          >
            <div style={uploadStyles.inputGroup}>
              <label style={uploadStyles.label}>视频名称</label>
              <input
                style={uploadStyles.input}
                value={state.title}
                onChange={e => handleFieldChange(editingId, 'title', e.target.value)}
              />
            </div>
            <div style={uploadStyles.inputGroup}>
              <label style={uploadStyles.label}>简介</label>
              <textarea
                style={uploadStyles.textarea}
                value={state.description}
                onChange={e => handleFieldChange(editingId, 'description', e.target.value)}
              />
            </div>
            <div style={uploadStyles.inputGroup}>
              <label style={uploadStyles.label}>学科分类</label>
              <select
                style={uploadStyles.select}
                value={state.subject}
                onChange={e => handleFieldChange(editingId, 'subject', e.target.value)}
              >
                {SUBJECTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div style={uploadStyles.inputGroup}>
              <label style={uploadStyles.label}>建议学历等级</label>
              <select
                style={uploadStyles.select}
                value={state.education_level}
                onChange={e => handleFieldChange(editingId, 'education_level', e.target.value)}
              >
                {LEVELS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            <div style={uploadStyles.freeRow}>
              {/*
              <label>
                <input
                  type="checkbox"
                  checked={state.is_free}
                  onChange={e => handleFieldChange(editingId, 'is_free', e.target.checked)}
                  style={{ marginRight: 6 }}
                /> 免费
              </label>
              */}
              {!state.is_free && (
                <>
                  <span>价格：</span>
                  <input
                    type="number"
                    style={{ ...uploadStyles.input, width: 80, margin: 0 }}
                    value={state.price}
                    min={0}
                    onChange={e => handleFieldChange(editingId, 'price', e.target.value)}
                  />
                  <span>SnapCoin</span>
                </>
              )}
            </div>
            <div style={uploadStyles.actionRow}>
              <button
                type="submit"
                style={uploadStyles.save}
                disabled={!state.changed}
              >
                保存修改
              </button>
              <button
                type="button"
                style={uploadStyles.cancel}
                onClick={handleCancel}
              >
                返回
              </button>
            </div>
          </form>
        </div>
      </UserLayout>
    );
  }

  // 列表模式
  return (
    <UserLayout>
      <div style={styles.container}>
        <h2 style={{ marginBottom: 24 }}>管理上传内容</h2>
        {videos.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 100, fontSize: 18, color: '#888' }}>暂无上传视频</div>
        ) : (
          <div style={styles.grid}>
            {videos.map(video => (
              <div key={video.id} style={styles.card}>
                <img
                  src={video.thumbnail_url || '/default-thumb.png'}
                  alt={video.title}
                  style={styles.thumb}
                />
                <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {video.title}
                </div>
                <div style={styles.btnRow}>
                  <button
                    style={{ ...styles.button, ...styles.edit }}
                    onClick={() => handleEdit(video.id)}
                  >
                    修改信息
                  </button>
                  <button
                    style={{ ...styles.button, ...styles.delete }}
                    onClick={() => handleDeleteVideo(video.id)}
                  >
                    删除视频
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}

export default ManageContentPage;