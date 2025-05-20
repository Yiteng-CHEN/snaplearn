import React, { useEffect, useState } from 'react';
import UserLayout from '../layouts/Layout';
import axios from 'axios';

function CheckHomeworkStudents({ homeworkId, onSelectStudent, onBack }) {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    axios.get(`/homework/${homeworkId}/students/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(res => setStudents(res.data || []));
  }, [homeworkId]);

  return (
    <UserLayout>
      <div style={{ maxWidth: 800, minHeight: 600, margin: '32px auto', background: '#fff', borderRadius: 8, padding: 32 }}>
        <button onClick={onBack} style={{ marginBottom: 16 }}>返回</button>
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>提交学生列表</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          {students.map(stu => (
            <div key={stu.id} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => onSelectStudent(stu.id)}>
              <img src={stu.avatar || '/default-avatar.png'} alt="" style={{ width: 64, height: 64, borderRadius: '50%', border: '1px solid #eee' }} />
              <div style={{ marginTop: 8 }}>{stu.username}</div>
            </div>
          ))}
        </div>
      </div>
    </UserLayout>
  );
}

export default CheckHomeworkStudents;
