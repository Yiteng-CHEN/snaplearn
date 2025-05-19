import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserLayout from '../layouts/Layout';
import { useNavigate } from 'react-router-dom';

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalCertificate, setModalCertificate] = useState('');
  const [modalRotate, setModalRotate] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, ox: 0, oy: 0 });
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 });
  const [imgNatural, setImgNatural] = useState({ width: 0, height: 0 });
  const [reviewComment, setReviewComment] = useState({});
  const [filterType, setFilterType] = useState('pending'); // 新增：筛选类型
  const imgRef = React.useRef();
  const navigate = useNavigate();

  useEffect(() => {
    // 获取当前用户信息，判断是否为管理员
    const fetchMe = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/users/me/', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setCurrentUserRole(res.data.role);
        if (res.data.role !== 'admin') {
          navigate('/videos', { replace: true });
        }
      } catch {
        navigate('/videos', { replace: true });
      }
    };
    fetchMe();
  }, [navigate]);

  useEffect(() => {
    // 仅管理员拉取用户列表
    if (currentUserRole !== 'admin') return;
    const fetchUsers = async () => {
      try {
        // 注意：后端 /users/ 路径不要带斜杠结尾，否则部分 Django 配置下会 404
        const response = await axios.get('http://127.0.0.1:8000/users', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        let userList = [];
        if (Array.isArray(response.data)) {
          userList = response.data;
        } else if (Array.isArray(response.data.results)) {
          userList = response.data.results;
        } else if (Array.isArray(response.data.users)) {
          userList = response.data.users;
        }
        setUsers(userList);
      } catch (error) {
        setMessage('获取用户信息失败');
      }
    };
    fetchUsers();
  }, [currentUserRole]);

  const handleVerifyUser = async (userId, approve) => {
    let comment = reviewComment[userId] || '';
    if (!approve && !comment.trim()) {
      setMessage('请填写审核不通过的意见');
      return;
    }
    try {
      // 管理员审核通过/拒绝
      const url = `http://127.0.0.1:8000/users/users/${userId}/verify-teacher/`;
      await axios.patch(
        url,
        { is_verified_teacher: approve, review_comment: approve ? '' : comment },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setMessage(approve ? '认证通过' : '认证未通过');
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId
            ? { ...user, is_verified_teacher: approve, review_comment: approve ? '' : comment }
            : user
        )
      );
      if (!approve) {
        setReviewComment((prev) => ({ ...prev, [userId]: '' }));
      }
    } catch (error) {
      setMessage('操作失败');
    }
  };

  // 计算图片显示尺寸
  const getImgDisplaySize = () => {
    // 旋转后宽高互换
    const rotate = (modalRotate % 180 !== 0);
    const maxW = rotate ? window.innerHeight * 0.8 : window.innerWidth * 0.9;
    const maxH = rotate ? window.innerWidth * 0.9 : window.innerHeight * 0.8;
    let w = imgNatural.width, h = imgNatural.height;
    if (!w || !h) return { width: 0, height: 0 };
    const scale = Math.min(maxW / w, maxH / h, 1);
    return { width: w * scale, height: h * scale };
  };

  // 拖动事件处理（修正旋转时的拖动方向，并限制边界）
  const handleImgMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY, ox: imgOffset.x, oy: imgOffset.y });
  };
  const handleImgMouseMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    // 旋转角度修正拖动方向
    let nx = dragStart.ox, ny = dragStart.oy;
    switch ((modalRotate % 360 + 360) % 360) {
      case 0:
        nx = dragStart.ox + dx;
        ny = dragStart.oy + dy;
        break;
      case 90:
        nx = dragStart.ox + dy;
        ny = dragStart.oy - dx;
        break;
      case 180:
        nx = dragStart.ox - dx;
        ny = dragStart.oy - dy;
        break;
      case 270:
        nx = dragStart.ox - dy;
        ny = dragStart.oy + dx;
        break;
      default:
        nx = dragStart.ox + dx;
        ny = dragStart.oy + dy;
    }
    // 限制边界
    const { width, height } = getImgDisplaySize();
    const winW = window.innerWidth * 0.95;
    const winH = window.innerHeight * 0.9;
    const minX = Math.min(0, (winW - width) / 2);
    const maxX = Math.max(0, (width - winW) / 2);
    const minY = Math.min(0, (winH - height) / 2);
    const maxY = Math.max(0, (height - winH) / 2);
    nx = Math.max(-maxX, Math.min(nx, maxX));
    ny = Math.max(-maxY, Math.min(ny, maxY));
    setImgOffset({ x: nx, y: ny });
  };
  const handleImgMouseUp = () => {
    setDragging(false);
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleImgMouseMove);
      window.addEventListener('mouseup', handleImgMouseUp);
    } else {
      window.removeEventListener('mousemove', handleImgMouseMove);
      window.removeEventListener('mouseup', handleImgMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleImgMouseMove);
      window.removeEventListener('mouseup', handleImgMouseUp);
    };
    // eslint-disable-next-line
  }, [dragging, dragStart, imgNatural, modalRotate]);

  // 关闭弹窗时重置偏移
  const closeModal = () => {
    setModalVisible(false);
    setModalRotate(0);
    setImgOffset({ x: 0, y: 0 });
  };

  // 图片加载时获取原始尺寸
  const handleImgLoad = (e) => {
    setImgNatural({
      width: e.target.naturalWidth,
      height: e.target.naturalHeight
    });
    setImgOffset({ x: 0, y: 0 });
  };

  // 筛选用户
  const getFilteredUsers = () => {
    if (filterType === 'pending') {
      return users.filter((user) => !user.is_verified_teacher && user.certificate && user.role !== 'admin');
    }
    if (filterType === 'verified') {
      return users.filter((user) => user.is_verified_teacher && user.role !== 'admin');
    }
    // "所有"：显示所有非管理员用户（不管是否认证）
    return users.filter((user) => user.role !== 'admin');
  };

  // 弹窗内容
  const renderModal = () => (
    modalVisible && (
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
          padding: '32px 40px 80px 40px',
          minWidth: 320,
          maxWidth: '95vw',
          maxHeight: '90vh',
          boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
          textAlign: 'center',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{ marginBottom: 24, fontSize: 16 }}>
            认证材料预览
          </div>
          {modalCertificate.endsWith('.pdf') ? (
            <iframe
              src={modalCertificate}
              title="certificate-pdf"
              style={{
                width: 'min(400px, 80vw)',
                height: 'min(500px, 60vh)',
                border: 'none'
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 200,
                minWidth: 200,
                maxWidth: '90vw',
                maxHeight: '80vh',
                overflow: 'hidden',
                cursor: dragging ? 'grabbing' : 'grab'
              }}
            >
              <img
                ref={imgRef}
                src={modalCertificate}
                alt="certificate"
                style={{
                  ...getImgDisplaySize(),
                  width: getImgDisplaySize().width,
                  height: getImgDisplaySize().height,
                  borderRadius: 8,
                  border: '1px solid #eee',
                  transform: `rotate(${modalRotate}deg) translate(${imgOffset.x}px, ${imgOffset.y}px)`,
                  transition: dragging ? 'none' : 'transform 0.2s, width 0.2s, height 0.2s',
                  display: 'block',
                  objectFit: 'contain',
                  cursor: dragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={handleImgMouseDown}
                onLoad={handleImgLoad}
                draggable={false}
              />
            </div>
          )}
          <div style={{
            position: 'absolute',
            left: 0,
            bottom: 16,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            gap: 24
          }}>
            <button
              style={{
                padding: '8px 24px',
                background: '#170917',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => setModalRotate(r => (r - 90 + 360) % 360)}
              title="逆时针翻转"
            >
              &#8634;
            </button>
            <button
              style={{
                padding: '8px 32px',
                background: '#170917',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              onClick={closeModal}
            >关闭</button>
            <button
              style={{
                padding: '8px 24px',
                background: '#170917',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => setModalRotate(r => (r + 90) % 360)}
              title="顺时针翻转"
            >
              &#8635;
            </button>
          </div>
        </div>
      </div>
    )
  );

  return (
    <UserLayout>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        <h2>管理员页面</h2>
        {/* 新增：筛选按钮组 */}
        <div style={{ display: 'flex', gap: 16, margin: '24px 0 18px 0' }}>
          <button
            style={{
              padding: '8px 32px',
              background: filterType === 'pending' ? '#1890ff' : '#ccc',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontWeight: 'bold',
              fontSize: 16,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onClick={() => setFilterType('pending')}
          >
            待认证
          </button>
          <button
            style={{
              padding: '8px 32px',
              background: filterType === 'verified' ? '#1890ff' : '#ccc',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontWeight: 'bold',
              fontSize: 16,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onClick={() => setFilterType('verified')}
          >
            已认证
          </button>
          <button
            style={{
              padding: '8px 32px',
              background: filterType === 'all' ? '#1890ff' : '#ccc',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              fontWeight: 'bold',
              fontSize: 16,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onClick={() => setFilterType('all')}
          >
            所有
          </button>
        </div>
        {message && <p>{message}</p>}
        <table border="2" style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px 16px' }}>用户名</th>
              <th style={{ padding: '12px 16px' }}>邮箱</th>
              <th style={{ padding: '12px 16px' }}>学历</th>
              <th style={{ padding: '12px 16px' }}>认证材料</th>
              <th style={{ padding: '12px 16px' }}>认证状态</th>
              <th style={{ padding: '12px 16px' }}>审核意见</th>
              <th style={{ padding: '12px 16px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {getFilteredUsers().map((user) => (
              <tr key={user.id}>
                <td style={{ padding: '12px 16px' }}>{user.username}</td>
                <td style={{ padding: '12px 16px' }}>{user.email}</td>
                <td style={{ padding: '12px 16px' }}>{user.education_level}</td>
                <td style={{ padding: '12px 16px' }}>
                  {user.certificate ? (
                    <button
                      style={{
                        color: '#1890ff',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                      onClick={() => {
                        setModalCertificate(user.certificate);
                        setModalVisible(true);
                      }}
                    >
                      查看材料
                    </button>
                  ) : (
                    '未上传'
                  )}
                </td>
                <td style={{ padding: '12px 16px' }}>{user.is_verified_teacher ? '已认证' : '未认证'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <input
                    type="text"
                    placeholder="审核不通过时填写"
                    value={reviewComment[user.id] || ''}
                    onChange={e => setReviewComment({ ...reviewComment, [user.id]: e.target.value })}
                    style={{ width: 120 }}
                    disabled={user.is_verified_teacher}
                  />
                  {user.review_comment && (
                    <div style={{ color: 'red', fontSize: 12, marginTop: 2 }}>{user.review_comment}</div>
                  )}
                </td>
                <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                  {!user.is_verified_teacher && (
                    <>
                      <button
                        onClick={() => handleVerifyUser(user.id, true)}
                        style={{
                          marginRight: 8,
                          background: !user.certificate ? '#eee' : undefined,
                          color: !user.certificate ? '#aaa' : undefined,
                          cursor: !user.certificate ? 'not-allowed' : 'pointer'
                        }}
                        disabled={!user.certificate}
                      >
                        认证通过
                      </button>
                      <button
                        onClick={() => handleVerifyUser(user.id, false)}
                        style={{
                          color: !user.certificate ? '#aaa' : 'red',
                          background: (!user.certificate || !reviewComment[user.id] || !reviewComment[user.id].trim()) ? '#eee' : undefined,
                          cursor: (!user.certificate || !reviewComment[user.id] || !reviewComment[user.id].trim()) ? 'not-allowed' : 'pointer'
                        }}
                        disabled={!user.certificate || !reviewComment[user.id] || !reviewComment[user.id].trim()}
                      >
                        拒绝认证
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {renderModal()}
      </div>
    </UserLayout>
  );
}

export default AdminPage;