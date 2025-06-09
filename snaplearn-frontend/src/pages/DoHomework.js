import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserLayout from '../layouts/Layout';
import axios from 'axios';

function DoHomework() {
  const { videoId } = useParams();
  const [homework, setHomework] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [msg, setMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [scoreInfo, setScoreInfo] = useState(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [pendingModal, setPendingModal] = useState(false); // 新增
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/videos/${videoId}/homework/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(res => {
      if (res.data && Array.isArray(res.data.questions) && res.data.questions.length > 0) {
        setHomework(res.data);
        setAnswers(res.data.questions.map(() => ''));
      } else {
        setHomework(null);
      }
    });
  }, [videoId]);

  const handleChange = (idx, value) => {
    setAnswers(ans => {
      const arr = [...ans];
      arr[idx] = value;
      return arr;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!homework) return;
    // 只校验客观题不能为空，主观题允许为空
    const incomplete = homework.questions.some((q, idx) =>
      (q.question_type === 'single' || q.question_type === 'multiple')
        ? !answers[idx] || !answers[idx].trim()
        : false
    );
    if (incomplete) {
      setMsg('请完成所有客观题');
      return;
    }
    try {
      const res = await axios.post(`http://127.0.0.1:8000/videos/${videoId}/submit_homework/`, {
        answers
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // 判断是否为待批改状态
      if (res.data && res.data.status === 'pending') {
        setPendingModal(true);
        setMsg('');
        setSubmitted(true);
      } else {
        setScoreInfo(res.data);
        setShowScoreModal(true);
        setMsg('');
        setSubmitted(true);
      }
    } catch {
      setMsg('提交失败，请稍后重试');
    }
  };

  return (
    <UserLayout>
      <div style={{
        maxWidth: 600,
        minHeight: 600,
        margin: '32px auto',
        background: '#fff',
        borderRadius: 8,
        padding: 32,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>作业答题</h2>
        {/* 成绩弹窗 */}
        {showScoreModal && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 8,
              padding: '32px 40px',
              minWidth: 320,
              boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
              textAlign: 'center'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 18 }}>成绩</div>
              <div style={{ marginBottom: 8 }}>总分：{homework && homework.questions.reduce((s, q) => s + (q.score || 5), 0)}</div>
              <div style={{ marginBottom: 8 }}>实际得分：{scoreInfo?.total_score ?? '--'}</div>
              <div style={{ marginBottom: 8 }}>百分制得分：{homework ? Math.round((scoreInfo?.total_score || 0) / homework.questions.reduce((s, q) => s + (q.score || 5), 0) * 100) : '--'} 分</div>
              {scoreInfo?.explanations && scoreInfo.explanations.length > 0 && (
                <div style={{ color: '#f00', margin: '12px 0' }}>
                  <div>错题：</div>
                  <ul style={{ textAlign: 'left', margin: '8px 0 0 0', padding: 0, listStyle: 'none' }}>
                    {scoreInfo.explanations.map((ex, i) => <li key={i}>{ex}</li>)}
                  </ul>
                </div>
              )}
              <div style={{ marginTop: 24, display: 'flex', gap: 18, justifyContent: 'center' }}>
                <button
                  style={{
                    background: '#1890ff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '10px 24px',
                    fontWeight: 'bold',
                    fontSize: 16,
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setShowScoreModal(false);
                    navigate('/mistakebook');
                  }}
                >查看错题</button>
                <button
                  style={{
                    background: '#eee',
                    color: '#333',
                    border: 'none',
                    borderRadius: 4,
                    padding: '10px 24px',
                    fontWeight: 'bold',
                    fontSize: 16,
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setShowScoreModal(false);
                    navigate('/videos');
                  }}
                >确定</button>
              </div>
            </div>
          </div>
        )}
        {/* 新增：待批改弹窗 */}
        {pendingModal && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 8,
              padding: '32px 40px',
              minWidth: 320,
              boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
              textAlign: 'center'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 18 }}>提交成功</div>
              <div style={{ marginBottom: 18 }}>作业已提交，成绩将在特定时段批改后可在“成绩查询”中查看。</div>
              <button
                style={{
                  background: '#1890ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '10px 24px',
                  fontWeight: 'bold',
                  fontSize: 16,
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setPendingModal(false);
                  // 跳转到成绩查询页
                  navigate('/scorequery');
                }}
              >去成绩查询</button>
            </div>
          </div>
        )}
        {!homework ? (
          <div style={{ textAlign: 'center', color: '#888', marginTop: 80 }}>未找到作业</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>{homework.title}</div>
            <div style={{ color: '#666', marginBottom: 18 }}>{homework.description}</div>
            {homework.questions.map((q, idx) => (
              <div key={idx} style={{ border: '1px solid #eee', borderRadius: 6, padding: 16, marginBottom: 18, background: '#fafbfc' }}>
                <div style={{ fontWeight: 'bold', marginBottom: 6 }}>
                  题目{idx + 1}（{q.question_type === 'single' ? '单选' : q.question_type === 'multiple' ? '多选' : '主观'}，分值：{q.score}）
                </div>
                <div style={{ marginBottom: 8 }}>{q.text}</div>
                {(q.question_type === 'single' || q.question_type === 'multiple') && (
                  <div style={{ marginBottom: 8 }}>
                    {q.options && q.options.map((opt, oIdx) => (
                      <div key={oIdx} style={{ marginBottom: 4 }}>
                        <label>
                          <input
                            type={q.question_type === 'single' ? 'radio' : 'checkbox'}
                            name={`q${idx}`}
                            value={String.fromCharCode(65 + oIdx)}
                            checked={
                              q.question_type === 'single'
                                ? answers[idx] === String.fromCharCode(65 + oIdx)
                                : (answers[idx] || '').split(',').includes(String.fromCharCode(65 + oIdx))
                            }
                            onChange={e => {
                              if (q.question_type === 'single') {
                                handleChange(idx, e.target.value);
                              } else {
                                // 多选
                                let arr = (answers[idx] || '').split(',').filter(Boolean);
                                if (e.target.checked) {
                                  arr.push(e.target.value);
                                } else {
                                  arr = arr.filter(v => v !== e.target.value);
                                }
                                handleChange(idx, arr.join(','));
                              }
                            }}
                            disabled={submitted}
                          />
                          <span style={{ marginLeft: 6 }}>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                {q.question_type === 'subjective' && (
                  <div>
                    <textarea
                      value={answers[idx]}
                      onChange={e => handleChange(idx, e.target.value)}
                      style={{ width: '100%', minHeight: 60, padding: 6, borderRadius: 4, border: '1px solid #ccc' }}
                      disabled={submitted}
                      required
                    />
                  </div>
                )}
              </div>
            ))}
            {msg && <div style={{ color: msg.includes('成功') ? 'green' : 'red', marginBottom: 16 }}>{msg}</div>}
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
                cursor: submitted ? 'not-allowed' : 'pointer',
                opacity: submitted ? 0.6 : 1
              }}
              disabled={submitted}
            >
              {submitted ? '已提交' : '提交作业'}
            </button>
          </form>
        )}
      </div>
    </UserLayout>
  );
}

export default DoHomework;
