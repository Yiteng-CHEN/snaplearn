import React, { useEffect, useState } from 'react';
import UserLayout from '../layouts/Layout';
import axios from 'axios';

function CheckHomeworkPage() {
  const [homeworks, setHomeworks] = useState([]);
  const [selectedHw, setSelectedHw] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [scoreEdits, setScoreEdits] = useState({}); // {answerIdx: {score, comment}}
  const [savingIdx, setSavingIdx] = useState(null);

  useEffect(() => {
    axios.get('/homework/myhomeworks/', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(res => setHomeworks(res.data || []));
  }, []);

  const handleReview = async (hwId) => {
    setSelectedHw(hwId);
    setSelectedStudent(null);
    setStudentDetail(null);
    const res = await axios.get(`/homework/homework/${hwId}/students/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setStudents(res.data || []);
  };

  const handleStudentClick = async (stuId) => {
    setSelectedStudent(stuId);
    const res = await axios.get(`/homework/homework/${selectedHw}/student/${stuId}/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setStudentDetail(res.data);
  };

  const handleScoreEdit = (idx, field, value) => {
    setScoreEdits(edits => ({
      ...edits,
      [idx]: { ...edits[idx], [field]: value }
    }));
  };

  const handleSaveScore = async (ans, idx) => {
    setSavingIdx(idx);
    const edit = scoreEdits[idx] || {};
    try {
      await axios.post('/homework/update_score/', {
        answer_id: ans.id,
        new_score: edit.score,
        comment: edit.comment || ''
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // 重新获取学生详情
      const res = await axios.get(`/homework/homework/${selectedHw}/student/${selectedStudent}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStudentDetail(res.data);
      setScoreEdits(edits => ({ ...edits, [idx]: undefined }));
    } finally {
      setSavingIdx(null);
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
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>作业审阅</h2>
        {!selectedHw ? (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <table style={{ width: '90%', marginBottom: 24, textAlign: 'center' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'center' }}>作业标题</th>
                  <th style={{ textAlign: 'center' }}>作业描述</th>
                  <th style={{ textAlign: 'center' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {homeworks.map(hw => (
                  <tr key={hw.id}>
                    <td>{hw.title}</td>
                    <td>{hw.description}</td>
                    <td>
                      <button onClick={() => handleReview(hw.id)}>审阅作业</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !selectedStudent ? (
          <div>
            <button onClick={() => setSelectedHw(null)} style={{ marginBottom: 18 }}>返回</button>
            <div style={{ marginBottom: 18, fontWeight: 'bold' }}>提交学生列表：</div>
            {students.length === 0 ? (
              <div style={{ color: '#888' }}>暂无学生提交</div>
            ) : (
              students.map(stu => (
                <div key={stu.id} style={{
                  display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0', cursor: 'pointer'
                }} onClick={() => handleStudentClick(stu.id)}>
                  <img
                    src={stu.avatar || '/logo192.png'}
                    alt="avatar"
                    style={{ width: 48, height: 48, borderRadius: '50%', marginRight: 16, objectFit: 'cover', background: '#eee' }}
                  />
                  <span style={{ fontWeight: 'bold', fontSize: 17 }}>{stu.username}</span>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            <button onClick={() => setSelectedStudent(null)} style={{ marginBottom: 18 }}>返回</button>
            <div style={{ fontWeight: 'bold', marginBottom: 12 }}>学生作业详情：</div>
            {studentDetail && (
              <div>
                <div>总分：{studentDetail.total_score}</div>
                <div>提交时间：{studentDetail.submitted_at}</div>
                <div>详细答题：</div>
                {studentDetail.answers.map((ans, idx) => (
                  <div key={idx} style={{ border: '1px solid #eee', borderRadius: 6, padding: 12, marginBottom: 12 }}>
                    <div>题目{idx + 1}：{ans.question_text}</div>
                    <div>学生答案：{ans.answer}</div>
                    <div>得分：{ans.score}</div>
                    <div>评语：{ans.comment}</div>
                    {ans.question_type === 'subjective' && (
                      <div style={{ marginTop: 8 }}>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          placeholder="修正分数"
                          value={scoreEdits[idx]?.score ?? ''}
                          onChange={e => handleScoreEdit(idx, 'score', e.target.value)}
                          style={{ width: 80, marginRight: 8 }}
                        />
                        <input
                          type="text"
                          placeholder="评语(可选)"
                          value={scoreEdits[idx]?.comment ?? ''}
                          onChange={e => handleScoreEdit(idx, 'comment', e.target.value)}
                          style={{ width: 180, marginRight: 8 }}
                        />
                        <button
                          disabled={savingIdx === idx || !scoreEdits[idx]?.score}
                          onClick={() => handleSaveScore(ans, idx)}
                        >
                          {savingIdx === idx ? '保存中...' : '保存修正'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </UserLayout>
  );
}

export default CheckHomeworkPage;
