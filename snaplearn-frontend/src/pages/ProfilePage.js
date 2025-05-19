import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import UserLayout from '../layouts/Layout';

function ProfilePage() {
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    education_level: '',
    is_verified_teacher: false,
    avatar: '',
    review_comment: '', // 新增：审核未通过原因
    role: '', // 新增：用户角色
  });
  const [certificate, setCertificate] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [message, setMessage] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwords, setPasswords] = useState({ old: '', new1: '', new2: '' });
  const [passwordMsg, setPasswordMsg] = useState('');
  const fileInputRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMsg, setModalMsg] = useState('');

  // 样式对象
  const styles = {
    outer: {
      width: '100%',
      minHeight: 'calc(100vh - 60px)', // 预留footer高度
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    container: {
      maxWidth: '400px',
      margin: '30px auto',
      padding: '60px',
      background: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      minHeight: '60vh',
    },
    avatarBox: {
      width: 60,
      height: 60,
      borderRadius: '50%',
      objectFit: 'cover',
      marginBottom: 16,
      border: '2px solid #eee',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f5',
      color: '#888',
      fontSize: 14,
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
      userSelect: 'none',
      marginLeft: 'auto',   // 新增：左右自动外边距
      marginRight: 'auto',  // 新增：左右自动外边距
    },
    avatarImg: {
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      objectFit: 'cover',
      display: 'block',
    },
    inputGroup: {
      marginBottom: '15px',
      width: '100%',
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      fontWeight: 'bold',
    },
    input: {
      width: '100%',
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid #ccc',
      marginBottom: '10px',
      marginTop: '10px',
    },
    select: {
      width: '100%',
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid #ccc',
      marginBottom: '10px',
      marginTop: '10px',
    },
    button: {
      width: '100%',
      marginTop: '20px',
      padding: '10px',
      backgroundColor: '#170917',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    hr: {
      width: '100%',
      margin: '24px 0',
    }
  };

  useEffect(() => {
    // 获取用户个人资料
    const fetchProfile = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/users/profile/', {
          headers: {
            Authorization: `Token ${localStorage.getItem('token')}`,
          },
        });
        setUserData(response.data);
        setAvatarPreview(response.data.avatar || '');
        setEmailInput(response.data.email || '');
      } catch (error) {
        setAvatarPreview('');
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const showMessage = (msg) => {
    setModalMsg(msg);
    setShowModal(true);
  };

  // 保存邮箱
  const handleSaveEmail = async () => {
    try {
      await axios.put(
        'http://127.0.0.1:8000/users/profile/',
        { email: emailInput, education_level: userData.education_level },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setUserData((prev) => ({ ...prev, email: emailInput }));
      showMessage('邮箱更新成功');
    } catch (error) {
      showMessage('邮箱更新失败');
    }
  };

  // 修改密码
  const handlePasswordChange = async () => {
    setPasswordMsg('');
    if (!passwords.old || !passwords.new1 || !passwords.new2) {
      setPasswordMsg('请填写所有密码字段');
      return;
    }
    if (passwords.new1 !== passwords.new2) {
      setPasswordMsg('两次新密码输入不一致');
      return;
    }
    try {
      await axios.post(
        'http://127.0.0.1:8000/users/change_password/',
        {
          old_password: passwords.old,
          new_password: passwords.new1,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setPasswordMsg('密码修改成功');
      setPasswords({ old: '', new1: '', new2: '' });
      showMessage('密码修改成功');
    } catch (error) {
      setPasswordMsg('密码修改失败');
      showMessage('密码修改失败');
    }
  };

  // 头像选择预览
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatarFile(file);
    if (file) {
      // 只预览本地文件，不立即上传
      const reader = new FileReader();
      reader.onload = function (ev) {
        setAvatarPreview(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarBoxClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 上传头像
  const handleUploadAvatar = async () => {
    if (!avatarFile) {
      showMessage('请先选择头像文件');
      return;
    }
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    try {
      // 上传头像
      await axios.put(
        'http://127.0.0.1:8000/users/profile/',
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      // 上传成功后刷新用户头像
      const response = await axios.get('http://127.0.0.1:8000/users/profile/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setUserData((prev) => ({ ...prev, avatar: response.data.avatar }));
      setAvatarPreview(response.data.avatar);
      setAvatarFile(null);
      // 新增：通知全局 layout 头像已更新
      window.dispatchEvent(new Event('avatar-updated'));
      showMessage('头像上传成功');
    } catch (error) {
      showMessage('头像上传失败');
    }
  };

  const handleUploadCertificate = async () => {
    if (!certificate) {
      showMessage('请上传认证材料');
      return;
    }
    const formData = new FormData();
    formData.append('certificate', certificate);
    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/users/upload_certificate/',
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      showMessage(response.data.message);
    } catch (error) {
      showMessage('上传认证材料失败');
    }
  };

  const handleCancelVerification = async () => {
    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/users/cancel_verification/',
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setUserData((prevData) => ({
        ...prevData,
        is_verified_teacher: false,
        review_comment: '', // 取消认证后清空审核意见
      }));
      showMessage(response.data.message || '取消认证成功');
    } catch (error) {
      // 优先显示后端返回的错误信息
      if (error.response && error.response.data && error.response.data.error) {
        showMessage(error.response.data.error);
      } else {
        showMessage('取消认证失败');
      }
    }
  };

  const handleSaveChanges = async () => {
    try {
      await axios.put(
        'http://127.0.0.1:8000/users/profile/',
        { education_level: userData.education_level, email: userData.email },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      showMessage('修改保存成功');
    } catch (error) {
      showMessage('修改保存失败');
    }
  };

  return (
    <UserLayout>
      <div style={styles.outer}>
        <div style={styles.container}>
          <h2 style={{ marginBottom: 24 }}>个人资料</h2>
          {/* 弹窗 */}
          {showModal && (
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
                minWidth: 260,
                boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: 24, fontSize: 16 }}>{modalMsg}</div>
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
                  onClick={() => setShowModal(false)}
                >确定</button>
              </div>
            </div>
          )}
          {message && <p style={{ color: message.includes('失败') ? 'red' : 'green', marginBottom: 10 }}>{message}</p>}
          {/* 头像显示与上传 */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div
              style={styles.avatarBox}
              onClick={handleAvatarBoxClick}
              title="点击上传头像"
            >
              {avatarPreview
                ? (
                  <>
                    <img
                      src={avatarPreview}
                      alt="avatar"
                      style={styles.avatarImg}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        background: 'rgba(0,0,0,0.35)',
                        fontWeight: 'bold',
                        fontSize: 12,
                        pointerEvents: 'none',
                        zIndex: 2
                      }}
                    >
                      上传头像
                    </span>
                  </>
                )
                : (
                  <span>上传头像</span>
                )
              }
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </div>
            <button style={styles.button} onClick={handleUploadAvatar}>保存头像</button>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>用户名：</label>
            <input
              type="text"
              name="username"
              value={userData.username}
              disabled
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>邮箱：</label>
            <input
              type="email"
              name="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              style={styles.input}
            />
            <button style={styles.button} onClick={handleSaveEmail}>保存邮箱</button>
          </div>
          {/* 修改密码区域 */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>修改密码：</label>
            <input
              type="password"
              placeholder="原密码"
              value={passwords.old}
              onChange={e => setPasswords(p => ({ ...p, old: e.target.value }))}
              style={styles.input}
            />
            <input
              type="password"
              placeholder="新密码"
              value={passwords.new1}
              onChange={e => setPasswords(p => ({ ...p, new1: e.target.value }))}
              style={styles.input}
            />
            <input
              type="password"
              placeholder="确认新密码"
              value={passwords.new2}
              onChange={e => setPasswords(p => ({ ...p, new2: e.target.value }))}
              style={styles.input}
            />
            <button style={styles.button} onClick={handlePasswordChange}>修改密码</button>
            {passwordMsg && <p style={{ color: passwordMsg.includes('成功') ? 'green' : 'red', marginTop: 6 }}>{passwordMsg}</p>}
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>学历：</label>
            <select
              name="education_level"
              value={userData.education_level}
              onChange={handleInputChange}
              style={styles.select}
            >
              <option value="primary">小学</option>
              <option value="middle">初中</option>
              <option value="high">高中</option>
              <option value="bachelor">本科</option>
              <option value="master">硕士</option>
              <option value="phd">博士</option>
            </select>
          </div>
          <button style={styles.button} onClick={handleSaveChanges}>保存修改</button>
          <hr style={styles.hr} />
          <h3 style={{ marginBottom: 12 }}>认证申请</h3>
          <p style={{fontSize: 12}}>（仅通过认证的用户可发布视频）</p>

          {/* 管理员不允许上传认证材料 */}
          {userData.role === 'admin' ? (
            <div style={{ width: '100%', color: '#888', textAlign: 'center', margin: '24px 0' }}>
              管理员账号无需认证，不能上传认证材料。
            </div>
          ) : userData.is_verified_teacher ? (
            <div style={{ width: '100%' }}>
              <p>您已通过认证</p>
              <button style={styles.button} onClick={handleCancelVerification}>取消认证</button>
            </div>
          ) : (
            <div style={{ width: '100%' }}>
              <p>认证材料：</p>
              <p style={{ textAlign: 'center' }}>上传硕士以上学历证书或教师资格证</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <input
                  type="file"
                  onChange={(e) => setCertificate(e.target.files[0])}
                  style={{
                    marginBottom: 10,
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                />
              </div>
              <div style={{ width: '100%', textAlign: 'center' }}>
                {/* 认证状态提示 */}
                {userData.is_verified_teacher ? (
                  <div style={{ color: 'green', fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>
                    认证成功！
                  </div>
                ) : (
                  userData.review_comment && (
                    <div>
                      <div style={{ color: 'red', fontWeight: 'bold', fontSize: 18, marginBottom: 4 }}>
                        认证失败！
                      </div>
                      <div style={{ color: 'red', fontSize: 15, marginBottom: 8 }}>
                        审核意见：（{userData.review_comment}）
                      </div>
                    </div>
                  )
                )}
              </div>
              <button style={styles.button} onClick={handleUploadCertificate}>上传认证材料</button>
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}

export default ProfilePage;