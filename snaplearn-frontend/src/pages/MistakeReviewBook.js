import React, { useEffect, useState } from 'react';
import UserLayout from '../layouts/Layout';
import axios from 'axios';

function MistakeReviewBook() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [msg, setMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    axios.get('/homework/mistakebook/', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(res => {
      // 只保留已批改的错题
      const gradedQuestions = (res.data || []).filter(q => q.status === 'graded' || !q.status);
      setQuestions(gradedQuestions);
      setAnswers(gradedQuestions.map(() => ''));
    });
  }, []);

  const handleChange = (idx, value) => {
    setAnswers(ans => {
      const arr = [...ans];
      arr[idx] = value;
      return arr;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    let correctCount = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      let isCorrect = false;
      if (q.question_type === 'single') {
        isCorrect = (answers[i].trim().toUpperCase() === String(q.answer).trim().toUpperCase());
      } else if (q.question_type === 'multiple') {
        const ansSet = new Set((answers[i] || '').split(',').map(x => x.trim().toUpperCase()).filter(Boolean));
        const stdSet = new Set((typeof q.answer === 'string' ? q.answer : (q.answer || '')).split(',').map(x => x.trim().toUpperCase()).filter(Boolean));
        isCorrect = ansSet.size === stdSet.size && [...ansSet].every(x => stdSet.has(x));
      } else {
        // 主观题不自动判分，实际可调用后端AI接口
        isCorrect = false;
      }
      // 答对一次就会被后端移除
      await axios.post('/homework/mistakebook/update/', {
        question_id: q.id,
        is_correct: isCorrect
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (isCorrect) correctCount++;
    }
    setMsg(`本次共答对 ${correctCount} / ${questions.length} 题。答对的题目将自动移除。`);
    setSubmitted(true);
    setTimeout(() => window.location.reload(), 1200);
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
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>错题集</h2>
        {questions.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#52c41a', marginTop: 80, fontSize: 20 }}>
            恭喜你，没有错题！
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {questions.map((q, idx) => (
              <div key={q.id} style={{ border: '1px solid #eee', borderRadius: 6, padding: 16, marginBottom: 18, background: '#fafbfc' }}>
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
                <div style={{ color: '#888', fontSize: 13 }}>
                  累计答错：{q.wrong_times} 次
                </div>
              </div>
            ))}
            {msg && <div style={{ color: msg.includes('答对') ? 'green' : 'red', marginBottom: 16 }}>{msg}</div>}
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
              {submitted ? '已提交' : '提交答案'}
            </button>
          </form>
        )}
      </div>
    </UserLayout>
  );
}

export default MistakeReviewBook;
