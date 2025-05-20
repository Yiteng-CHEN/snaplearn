import React, { useEffect, useState } from 'react';
import UserLayout from '../layouts/Layout';
import axios from 'axios';

function CheckHomeworkDetail({ homeworkId, studentId, onBack }) {
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    axios.get(`/homework/${homeworkId}/student/${studentId}/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(res => setDetail(res.data));
  }, [homeworkId, studentId]);

  if (!detail) return (
    <UserLayout>
      <div style={{ maxWidth: 800, minHeight: 600, margin: '32px auto', background: '#fff', borderRadius: 8, padding: 32 }}>
        <button onClick={onBack} style={{ marginBottom: 16 }}>返回</button>
        <div>加载中...</div>
      </div>
    </UserLayout>
  );

  return (
    <UserLayout>
      <div style={{ maxWidth: 800, minHeight: 600, margin: '32px auto', background: '#fff', borderRadius: 8, padding: 32 }}>
        <button onClick={onBack} style={{ marginBottom: 16 }}>返回</button>
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>作业详情</h2>
        <div style={{ marginBottom: 16 }}>总分：{detail.total_score}</div>
        <div style={{ marginBottom: 16 }}>提交时间：{detail.submitted_at}</div>
        {detail.answers.filter(a => a.score < 1 || a.comment).length === 0 ? (
          <div style={{ color: '#52c41a', textAlign: 'center', marginTop: 80 }}>没有错题或主观题</div>
        ) : (
          detail.answers.filter(a => a.score < 1 || a.comment).map((a, idx) => (
            <div key={idx} style={{ border: '1px solid #eee', borderRadius: 6, padding: 16, marginBottom: 18, background: '#fafbfc' }}>
              <div style={{ fontWeight: 'bold', marginBottom: 6 }}>{a.question_text}</div>
              <div>学生答案：{a.answer}</div>
              <div>得分：{a.score}</div>
              {a.comment && <div>评语：{a.comment}</div>}
            </div>
          ))
        )}
      </div>
    </UserLayout>
  );
}

export default CheckHomeworkDetail;
