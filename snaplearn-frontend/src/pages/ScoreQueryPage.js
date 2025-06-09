import React, { useEffect, useState } from 'react';
import UserLayout from '../layouts/Layout';
import axios from 'axios';

function ScoreQueryPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ visible: false, record: null });

  useEffect(() => {
    axios.get('/homework/my_scores/', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(res => {
      setRecords(res.data || []);
      setLoading(false);
    });
  }, []);

  const getStatusText = (status) => {
    if (status === 'graded') return '已批改';
    if (status === 'pending') return '待批改';
    return status || '';
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
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>成绩查询</h2>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#888', marginTop: 80 }}>加载中...</div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', marginTop: 80 }}>暂无作业记录</div>
        ) : (
          <table style={{ textAlign: 'center', width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: 8 }}>提交时间</th>
                <th style={{ padding: 8 }}>作业名称</th>
                <th style={{ padding: 8 }}>批改状态</th>
                <th style={{ padding: 8 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>{rec.submitted_at ? rec.submitted_at.replace('T', ' ').slice(0, 19) : '--'}</td>
                  <td style={{ padding: 8 }}>{rec.homework_title}</td>
                  <td style={{ padding: 8 }}>{getStatusText(rec.status)}</td>
                  <td style={{ padding: 8 }}>
                    <button
                      disabled={rec.status !== 'graded'}
                      style={{
                        background: rec.status === 'graded' ? '#1890ff' : '#eee',
                        color: rec.status === 'graded' ? '#fff' : '#888',
                        border: 'none',
                        borderRadius: 4,
                        padding: '6px 18px',
                        cursor: rec.status === 'graded' ? 'pointer' : 'not-allowed'
                      }}
                      onClick={() => setModal({ visible: true, record: rec })}
                    >查询</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {/* 成绩弹窗 */}
        {modal.visible && modal.record && (
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
              textAlign: 'center',
              position: 'relative'
            }}>
              <button
                style={{
                  position: 'absolute',
                  right: 12,
                  top: 12,
                  background: 'none',
                  border: 'none',
                  fontSize: 22,
                  color: '#888',
                  cursor: 'pointer'
                }}
                onClick={() => setModal({ visible: false, record: null })}
                title="关闭"
              >×</button>
              <div style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 18 }}>成绩详情</div>
              <div style={{ marginBottom: 8 }}>作业名称：{modal.record.homework_title}</div>
              <div style={{ marginBottom: 8 }}>提交时间：{modal.record.submitted_at ? modal.record.submitted_at.replace('T', ' ').slice(0, 19) : '--'}</div>
              <div style={{ marginBottom: 8 }}>总分：{modal.record.total_score ?? '--'}</div>
              <div style={{ marginBottom: 8 }}>批改说明：{modal.record.explanations && modal.record.explanations.length > 0
                ? <ul style={{ textAlign: 'left', margin: 0, padding: 0, listStyle: 'none' }}>
                    {modal.record.explanations.map((ex, i) => <li key={i}>{ex}</li>)}
                  </ul>
                : '无'}
              </div>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
}

export default ScoreQueryPage;
