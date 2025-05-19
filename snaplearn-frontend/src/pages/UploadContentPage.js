import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserLayout from '../layouts/Layout';
import { useNavigate } from 'react-router-dom';

function UploadContentPage() {
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [subject, setSubject] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [isVerifiedTeacher, setIsVerifiedTeacher] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [thumbnailFile, setThumbnailFile] = useState(null); // 新增：封面文件
  const navigate = useNavigate();

  const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'];
  const educationLevels = [
    { value: 'primary', label: '小学' },
    { value: 'middle', label: '初中' },
    { value: 'high', label: '高中' },
    { value: 'bachelor', label: '本科' },
    { value: 'master', label: '硕士' },
    { value: 'phd', label: '博士' }
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // 修改为完整后端地址，避免代理问题
        const res = await axios.get('http://localhost:8000/users/profile/', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setIsVerifiedTeacher(!!res.data.is_verified_teacher);
      } catch {
        setIsVerifiedTeacher(false);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!loading && !isVerifiedTeacher) {
      if (countdown <= 0) {
        navigate('/videos');
        return;
      }
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, isVerifiedTeacher, countdown, navigate]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!videoTitle || !videoFile || !subject || !educationLevel) {
      setMsg('请填写所有信息');
      return;
    }
    const formData = new FormData();
    formData.append('title', videoTitle);
    formData.append('description', videoDesc);
    formData.append('subject', subject);
    formData.append('education_level', educationLevel);
    formData.append('video_file', videoFile);
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile); // 新增：上传封面
    }

    try {
      await axios.post('/videos/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setMsg('上传成功！');
      setVideoTitle('');
      setVideoDesc('');
      setVideoFile(null);
      setSubject('');
      setEducationLevel('');
      setThumbnailFile(null); // 清空封面
      setTimeout(() => navigate('/videos'), 1200);
    } catch (err) {
      setMsg('上传失败，请检查信息或稍后重试');
    }
  };

  if (loading) return <UserLayout><div>正在加载...</div></UserLayout>;
  if (!isVerifiedTeacher) {
    return (
      <UserLayout>
        <div style={{ maxWidth: 400, margin: '60px auto', background: '#fff', borderRadius: 8, padding: 40, textAlign: 'center' }}>
          <h2>仅认证教师可上传视频</h2>
          <div style={{ color: '#888', marginTop: 24 }}>请前往个人资料页提交认证材料</div>
          <div style={{ color: '#888', marginTop: 24 }}>即将返回视频页（{countdown} 秒）</div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div style={{
        maxWidth: 480,
        margin: '40px auto',
        background: '#fff',
        borderRadius: 8,
        padding: 40,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: 32 }}>上传视频</h2>
        {msg && <div style={{ color: msg.includes('成功') ? 'green' : 'red', marginBottom: 16 }}>{msg}</div>}
        <form onSubmit={handleUpload}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 'bold' }}>视频名称：</label>
            <input
              type="text"
              value={videoTitle}
              onChange={e => setVideoTitle(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', marginTop: 8 }}
              required
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 'bold' }}>简介：</label>
            <textarea
              value={videoDesc}
              onChange={e => setVideoDesc(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', marginTop: 8, minHeight: 60 }}
              required
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 'bold' }}>学科分类：</label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', marginTop: 8 }}
              required
            >
              <option value="">请选择</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 'bold' }}>建议学历等级：</label>
            <select
              value={educationLevel}
              onChange={e => setEducationLevel(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', marginTop: 8 }}
              required
            >
              <option value="">请选择</option>
              {educationLevels.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 'bold' }}>视频文件：</label>
            <input
              type="file"
              accept="video/*"
              onChange={e => setVideoFile(e.target.files[0])}
              style={{ marginTop: 8 }}
              required
            />
          </div>
          {/* 新增：上传封面 */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 'bold' }}>视频封面（可选）：</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setThumbnailFile(e.target.files[0])}
              style={{ marginTop: 8 }}
            />
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: 12,
              background: '#1890ff',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontWeight: 'bold',
              fontSize: 16,
              cursor: 'pointer'
            }}
          >
            上传
          </button>
        </form>
      </div>
    </UserLayout>
  );
}

export default UploadContentPage;