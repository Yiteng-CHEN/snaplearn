import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserLayout from '../layouts/Layout';
import { useNavigate } from 'react-router-dom';

// 作业题型
const QUESTION_TYPES = [
  { value: 'single', label: '单选题' },
  { value: 'multiple', label: '多选题' },
  { value: 'subjective', label: '主观题' }
];

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
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const navigate = useNavigate();

  const [uploadHomework, setUploadHomework] = useState(false);
  const [homeworkTitle, setHomeworkTitle] = useState('');
  const [homeworkDesc, setHomeworkDesc] = useState('');
  const [questions, setQuestions] = useState([
    { question_type: 'single', text: '', options: ['', '', '', ''], answer: '', score: 5 }
  ]);

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

  const handleQuestionChange = (idx, field, value) => {
    setQuestions(qs => {
      const arr = [...qs];
      arr[idx][field] = value;
      if (field === 'question_type') {
        if (value === 'subjective') {
          arr[idx].options = [];
          arr[idx].answer = '';
        } else {
          arr[idx].options = ['', '', '', ''];
          arr[idx].answer = '';
        }
      }
      return arr;
    });
  };

  const handleOptionChange = (qIdx, oIdx, value) => {
    setQuestions(qs => {
      const arr = [...qs];
      arr[qIdx].options[oIdx] = value;
      return arr;
    });
  };

  const addQuestion = () => {
    setQuestions(qs => [...qs, { question_type: 'single', text: '', options: ['', '', '', ''], answer: '', score: 5 }]);
  };

  const removeQuestion = idx => {
    setQuestions(qs => qs.length > 1 ? qs.filter((_, i) => i !== idx) : qs);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!videoTitle || !videoFile || !subject || !educationLevel) {
      setMsg('请填写所有信息');
      return;
    }
    if (uploadHomework) {
      if (!homeworkTitle || questions.some(q => !q.text || !q.score)) {
        setMsg('请填写完整作业信息');
        return;
      }
    }
    const formData = new FormData();
    formData.append('title', videoTitle);
    formData.append('description', videoDesc);
    formData.append('subject', subject);
    formData.append('education_level', educationLevel);
    formData.append('video_file', videoFile);
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }
    if (uploadHomework) {
      formData.append('homework_title', homeworkTitle);
      formData.append('homework_description', homeworkDesc);
      formData.append('questions', JSON.stringify(questions));
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
      setThumbnailFile(null);
      setUploadHomework(false);
      setHomeworkTitle('');
      setHomeworkDesc('');
      setQuestions([{ question_type: 'single', text: '', options: ['', '', '', ''], answer: '', score: 5 }]);
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
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 'bold' }}>视频封面（可选）：</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setThumbnailFile(e.target.files[0])}
              style={{ marginTop: 8 }}
            />
          </div>
          <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={uploadHomework}
              onChange={e => setUploadHomework(e.target.checked)}
              id="upload-homework"
              style={{ marginRight: 8 }}
            />
            <label htmlFor="upload-homework" style={{ fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>上传作业</label>
          </div>
          {uploadHomework && (
            <div style={{
              border: '1px solid #eee',
              borderRadius: 8,
              padding: 18,
              marginBottom: 18,
              background: '#fafbfc'
            }}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 'bold' }}>作业标题：</label>
                <input
                  type="text"
                  value={homeworkTitle}
                  onChange={e => setHomeworkTitle(e.target.value)}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', marginTop: 8 }}
                  required
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 'bold' }}>作业描述：</label>
                <textarea
                  value={homeworkDesc}
                  onChange={e => setHomeworkDesc(e.target.value)}
                  style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', marginTop: 8, minHeight: 40 }}
                />
              </div>
              {questions.map((q, idx) => (
                <div key={idx} style={{ border: '1px solid #eee', borderRadius: 6, padding: 16, marginBottom: 18, background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 'bold', marginRight: 12 }}>题目{idx + 1}</span>
                    <select
                      value={q.question_type}
                      onChange={e => handleQuestionChange(idx, 'question_type', e.target.value)}
                      style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', marginRight: 8 }}
                    >
                      {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <button type="button" onClick={() => removeQuestion(idx)} style={{ marginLeft: 'auto', color: '#f00', background: 'none', border: 'none', cursor: 'pointer' }}>删除</button>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <input
                      type="text"
                      placeholder="题干"
                      value={q.text}
                      onChange={e => handleQuestionChange(idx, 'text', e.target.value)}
                      style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #ccc' }}
                      required
                    />
                  </div>
                  {(q.question_type === 'single' || q.question_type === 'multiple') && (
                    <>
                      <div style={{ marginBottom: 8 }}>
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ width: 18 }}>{String.fromCharCode(65 + oIdx)}.</span>
                            <input
                              type="text"
                              value={opt}
                              onChange={e => handleOptionChange(idx, oIdx, e.target.value)}
                              style={{ flex: 1, padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
                              required
                            />
                          </div>
                        ))}
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <label>参考答案：</label>
                        <input
                          type="text"
                          placeholder={q.question_type === 'single' ? '如A' : '如A,B'}
                          value={q.answer}
                          onChange={e => handleQuestionChange(idx, 'answer', e.target.value)}
                          style={{ width: 120, padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
                          required
                        />
                        <span style={{ color: '#888', marginLeft: 8 }}>
                          {q.question_type === 'single' ? '（单选，填A/B/C/D）' : '（多选，填A,B）'}
                        </span>
                      </div>
                    </>
                  )}
                  {q.question_type === 'subjective' && (
                    <div style={{ marginBottom: 8 }}>
                      <label>参考答案及评分标准：</label>
                      <textarea
                        value={q.answer}
                        onChange={e => handleQuestionChange(idx, 'answer', e.target.value)}
                        style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #ccc', minHeight: 40 }}
                        required
                      />
                      <span style={{ color: '#888', fontSize: 13 }}>（主观题答案及评分标准，后续将被AI调用作为打分标准）</span>
                    </div>
                  )}
                  <div>
                    <label>分值：</label>
                    <input
                      type="number"
                      value={q.score}
                      min={1}
                      onChange={e => handleQuestionChange(idx, 'score', e.target.value)}
                      style={{ width: 80, padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
                      required
                    />
                  </div>
                </div>
              ))}
              <button type="button" onClick={addQuestion} style={{ marginBottom: 18, background: '#eee', border: 'none', borderRadius: 4, padding: '8px 18px', cursor: 'pointer' }}>添加题目</button>
            </div>
          )}
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