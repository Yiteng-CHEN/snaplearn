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
const QUESTION_TYPES = [
  { value: 'single', label: '单选题' },
  { value: 'multiple', label: '多选题' },
  { value: 'subjective', label: '主观题' }
];

function ManageContentPage() {
  const [videos, setVideos] = useState([]);
  const [editStates, setEditStates] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [hasHomework, setHasHomework] = useState(false);
  const [homeworkTitle, setHomeworkTitle] = useState('');
  const [homeworkDesc, setHomeworkDesc] = useState('');
  const navigate = useNavigate();

  // 检查作业内容是否有变化
  const isHomeworkChanged = (origin, curTitle, curDesc, curQuestions) => {
    if (!origin) return false;
    if ((origin.title || '') !== (curTitle || '')) return true;
    if ((origin.description || '') !== (curDesc || '')) return true;
    // 题目数量不同
    if ((origin.questions || []).length !== (curQuestions || []).length) return true;
    // 题目内容不同
    for (let i = 0; i < (origin.questions || []).length; i++) {
      const a = origin.questions[i];
      const b = curQuestions[i];
      if (!b) return true;
      if (a.question_type !== b.question_type) return true;
      if ((a.text || '') !== (b.text || '')) return true;
      if ((a.answer || '') !== (b.answer || '')) return true;
      if (Number(a.score) !== Number(b.score)) return true;
      // 选项比较
      if ((a.options || []).join('|||') !== (b.options || []).join('|||')) return true;
    }
    return false;
  };

  // 保存原始作业数据用于对比
  const [originHomework, setOriginHomework] = useState(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/videos/manage/', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const videosWithThumb = (response.data.videos || []).map(v => {
          let thumb = v.thumbnail_url;
          if (thumb && !/^https?:\/\//.test(thumb)) {
            const origin = window.location.origin;
            if (thumb.startsWith('/')) {
              thumb = origin + thumb;
            } else {
              thumb = origin + '/' + thumb;
            }
          }
          if (!thumb) {
            let base = '';
            if (v.video_file) {
              let fileName = '';
              if (typeof v.video_file === 'string') {
                fileName = v.video_file.split('/').pop();
              } else if (v.video_file && v.video_file.name) {
                fileName = v.video_file.name.split('/').pop();
              }
              base = fileName.split('.')[0];
              thumb = window.location.origin + `/media/thumbnails/${base}.jpg`;
            }
          }
          return { ...v, thumbnail_url: thumb };
        });
        setVideos(videosWithThumb);
        const states = {};
        videosWithThumb.forEach(v => {
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

  useEffect(() => {
    if (!editingId) return;
    if (thumbnailFile) {
      setEditStates(prev => ({
        ...prev,
        [editingId]: { ...prev[editingId], changed: true }
      }));
    }
  }, [thumbnailFile, editingId]);

  // 编辑模式时拉取题目
  useEffect(() => {
    if (!editingId) return;
    (async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/videos/${editingId}/homework/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.data && Array.isArray(res.data.questions) && res.data.questions.length > 0) {
          setHasHomework(true);
          setHomeworkTitle(res.data.title || '');
          setHomeworkDesc(res.data.description || '');
          setQuestions(res.data.questions.map(q => ({
            ...q,
            options: Array.isArray(q.options) ? q.options : (q.question_type !== 'subjective' ? ['', '', '', ''] : [])
          })));
          setOriginHomework({
            title: res.data.title || '',
            description: res.data.description || '',
            questions: res.data.questions.map(q => ({
              ...q,
              options: Array.isArray(q.options) ? q.options : (q.question_type !== 'subjective' ? ['', '', '', ''] : [])
            }))
          });
        } else {
          setHasHomework(false);
          setHomeworkTitle('');
          setHomeworkDesc('');
          setQuestions([{ question_type: 'single', text: '', options: ['', '', '', ''], answer: '', score: 5 }]);
          setOriginHomework(null);
        }
      } catch {
        setHasHomework(false);
        setHomeworkTitle('');
        setHomeworkDesc('');
        setQuestions([{ question_type: 'single', text: '', options: ['', '', '', ''], answer: '', score: 5 }]);
        setOriginHomework(null);
      }
    })();
  }, [editingId]);

  // 只要视频信息或作业内容有变化，changed 就为 true
  const isChanged = (video, state, hasHomework, originHomework, homeworkTitle, homeworkDesc, questions) => {
    let changed =
      video.title !== state.title ||
      video.description !== state.description ||
      (video.subject || SUBJECTS[0]) !== state.subject ||
      (video.education_level || LEVELS[0].value) !== state.education_level ||
      video.is_free !== state.is_free ||
      (video.price || '') !== state.price;
    if (hasHomework) {
      changed = changed || isHomeworkChanged(originHomework, homeworkTitle, homeworkDesc, questions);
    }
    // 如果作业从有到无或无到有也算变化
    if (!!originHomework !== !!hasHomework) changed = true;
    return changed;
  };

  // 检查视频和作业内容是否有变化，自动设置 changed
  useEffect(() => {
    if (!editingId) return;
    setEditStates(prev => {
      const video = videos.find(v => v.id === editingId);
      const state = prev[editingId];
      const changed = isChanged(
        video,
        state,
        hasHomework,
        originHomework,
        homeworkTitle,
        homeworkDesc,
        questions
      );
      return { ...prev, [editingId]: { ...state, changed } };
    });
    // eslint-disable-next-line
  }, [homeworkTitle, homeworkDesc, questions, hasHomework, originHomework, editingId, videos]);

  const handleFieldChange = (id, field, value) => {
    setEditStates(prev => {
      const video = videos.find(v => v.id === id);
      const newState = { ...prev[id], [field]: value };
      // 这里也要用新的 isChanged
      newState.changed = isChanged(
        video,
        newState,
        hasHomework,
        originHomework,
        homeworkTitle,
        homeworkDesc,
        questions
      );
      return { ...prev, [id]: newState };
    });
  };

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

  const handleEdit = (id) => {
    setEditingId(id);
    // 自动展开作业区域（如果有作业，useEffect 拉取后会 setHasHomework(true)）
    setHasHomework(true);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleSave = async (id) => {
    const state = editStates[id];
    try {
      const formData = new FormData();
      formData.append('title', state.title);
      formData.append('description', state.description);
      formData.append('subject', state.subject);
      formData.append('education_level', state.education_level);
      formData.append('is_free', state.is_free ? 'true' : 'false');
      formData.append('price', state.is_free ? '' : String(state.price || ''));
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }
      if (hasHomework) {
        formData.append('homework_title', homeworkTitle);
        formData.append('homework_description', homeworkDesc);
        formData.append('questions', JSON.stringify(questions));
      }
      await axios.post(
        `http://127.0.0.1:8000/videos/${id}/update/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
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
      setThumbnailFile(null);
      alert('保存成功');
      setEditingId(null);
    } catch (error) {
      // 新增：打印后端返回的详细错误
      if (error.response && error.response.data && error.response.data.error) {
        alert('更新视频信息失败: ' + error.response.data.error);
      } else {
        alert('更新视频信息失败');
      }
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
      // 新增：显示后端返回的详细错误
      if (error.response && error.response.data && error.response.data.error) {
        alert('删除视频失败: ' + error.response.data.error);
      } else {
        alert('删除视频失败');
      }
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

  if (editingId) {
    const state = editStates[editingId];
    const video = videos.find(v => v.id === editingId);
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
            <div style={uploadStyles.inputGroup}>
              <label style={uploadStyles.label}>视频封面（可选）</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setThumbnailFile(e.target.files[0])}
                style={{ marginTop: 8 }}
              />
              {video && video.thumbnail_url && (
                <div style={{ marginTop: 6, color: '#888', fontSize: 13 }}>
                  当前封面：<span style={{ wordBreak: 'break-all' }}>{video.thumbnail_url}</span>
                </div>
              )}
            </div>
            <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={hasHomework}
                onChange={e => setHasHomework(e.target.checked)}
                id="edit-homework"
                style={{ marginRight: 8 }}
              />
              <label htmlFor="edit-homework" style={{ fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>包含作业</label>
            </div>
            {hasHomework && (
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