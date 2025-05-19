import React, { useState, useEffect } from 'react';
import { Layout, Menu } from 'antd';
import 'antd/dist/reset.css';
import { Link, useNavigate } from 'react-router-dom';
import CertifiedAvatar from '../components/CertifiedAvatar';

const { Header, Content, Footer } = Layout;

const UserLayout = ({ children }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState(''); // 新增：保存用户头像
  const [showMenu, setShowMenu] = useState(false);
  const [menuLocked, setMenuLocked] = useState(false); // 新增：菜单锁定状态
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);
  const [usernameHover, setUsernameHover] = useState(false);
  const [dropdownHoverIndex, setDropdownHoverIndex] = useState(-1);
  const [logoHover, setLogoHover] = useState(false);
  const [isVerifiedTeacher, setIsVerifiedTeacher] = useState(false);
  const [role, setRole] = useState('');
  const [adminHover, setAdminHover] = useState(false); // 新增：管理认证按钮hover状态

  // 拉取用户信息的函数，供内部和事件调用
  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/users/profile/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsername(data.username || '');
        setAvatar(data.avatar || '');
        setIsVerifiedTeacher(!!data.is_verified_teacher);
        setRole(data.role || '');
      }
    } catch {}
  };

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line
  }, []);

  // 新增：用于监听头像变更的事件
  useEffect(() => {
    const handleAvatarUpdated = (e) => {
      // 重新拉取用户信息
      fetchUser();
    };
    window.addEventListener('avatar-updated', handleAvatarUpdated);
    return () => window.removeEventListener('avatar-updated', handleAvatarUpdated);
  }, []);

  const handleProfileClick = () => {
    setShowMenu(false);
    navigate('/profile');
  };

  const handleLogout = () => {
    setShowMenu(false);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('avatar');
    navigate('/login');
  };

  const styles = {
    header: {
      position: 'fixed',
      zIndex: 1,
      width: '100%',
      backgroundColor: '#001529',
      display: 'flex',
      alignItems: 'center',
      padding: '70px 60px',
    },
    logo: {
      color: '#fff',
      fontSize: '20px',
      fontWeight: 'bold',
      marginRight: 'auto',
    },
    user: {
      display: 'flex',
      alignItems: 'center',
      marginRight: '20px',
      position: 'relative',
    },
    avatar: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      marginRight: '16px',
      objectFit: 'cover',
      border: '2px solid #fff',
      cursor: 'pointer',
      transition: 'box-shadow 0.2s, border 0.2s',
    },
    avatarHover: {
      border: '2px solid #1890ff',
    },
    username: {
      color: '#fff',
      fontSize: '18px',
      fontWeight: 'bold',
      cursor: 'pointer',
      userSelect: 'none',
      position: 'relative',
      transition: 'color 0.5s',
      marginLeft: '50px',
    },
    usernameHover: {
      color: '#1890ff',
    },
    dropdown: {
      position: 'absolute',
      top: '60px',
      right: 0,
      background: '#fff',
      color: '#333',
      borderRadius: '10px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      minWidth: '100px',
      zIndex: 100,
      overflow: 'hidden',
    },
    dropdownItem: {
      padding: '12px 20px',
      cursor: 'pointer',
      fontSize: '15px',
      borderBottom: '1px solid #f0f0f0',
      background: '#fff',
      transition: 'background 0.2s',
    },
    dropdownItemHover: {
      background: '#f5f5f5',
    },
    dropdownItemLast: {
      padding: '12px 20px',
      cursor: 'pointer',
      fontSize: '15px',
      background: '#fff',
      transition: 'background 0.2s',
    },
    dropdownItemLastHover: {
      background: '#f5f5f5',
    },
    content: {
      padding: '24px 50px',
      marginTop: '64px',
      flex: 1,
      backgroundColor: '#f0f2f5',
    },
    footer: {
      textAlign: 'center',
      backgroundColor: '#001529',
      color: '#fff',
      padding: '10px 0',
    },
    avatarModalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.5)',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarModalImg: {
      width: '320px',
      height: '320px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '6px solid #fff',
      background: '#fff',
      boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
    },
  };

  // 头像显示逻辑
  const avatarContent = (
    <CertifiedAvatar
      src={avatar}
      isCertified={isVerifiedTeacher}
      size={45}
      onClick={() => setShowAvatarModal(true)}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 页眉 */}
      <Header style={styles.header}>
        <Link
          to="/videos"
          style={{
            ...styles.logo,
            color: logoHover ? '#1890ff' : styles.logo.color,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={() => setLogoHover(true)}
          onMouseLeave={() => setLogoHover(false)}
        >
          SnapLearn
        </Link>
        <div style={styles.user}>
          {avatarContent}
          <span
            style={{
              ...styles.username,
              // 用户名在profile页面时变蓝色
              color:
                window.location.pathname === '/profile'
                  ? '#1890ff'
                  : (usernameHover || showMenu ? styles.usernameHover.color : styles.username.color),
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={e => {
              // 如果鼠标在“管理认证”按钮上，不显示下拉菜单
              if (
                role === 'admin' &&
                e.target &&
                e.target.innerText === '管理认证'
              ) {
                setUsernameHover(false);
                return;
              }
              if (!menuLocked) {
                setShowMenu(true);
              }
              setUsernameHover(true);
            }}
            onMouseLeave={() => {
              setUsernameHover(false);
              if (!menuLocked) {
                setTimeout(() => setShowMenu(false), 200);
              }
            }}
            onClick={() => {
              if (menuLocked) {
                setMenuLocked(false);
                setShowMenu(false);
              } else {
                setMenuLocked(true);
                setShowMenu(true);
              }
            }}
          >
            {username || '用户'}
            {/* 管理员显示“管理认证” */}
            {role === 'admin' && (
              <span
                style={{
                  marginLeft: 28,
                  fontWeight: 'bold',
                  fontSize: 15,
                  cursor: 'pointer',
                  userSelect: 'none',
                  color:
                    adminHover || window.location.pathname === '/admin'
                      ? '#1890ff'
                      : '#fff',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => {
                  setAdminHover(true);
                  setShowMenu(false);
                  setUsernameHover(false);
                }}
                onMouseLeave={() => setAdminHover(false)}
                onClick={e => {
                  e.stopPropagation();
                  if (window.location.pathname !== '/admin') {
                    navigate('/admin');
                  }
                }}
              >
                管理认证
              </span>
            )}
            {(showMenu || menuLocked) && (
              <div
                style={styles.dropdown}
                onMouseEnter={() => {
                  if (!menuLocked) setShowMenu(true);
                }}
                onMouseLeave={() => {
                  if (!menuLocked) setShowMenu(false);
                }}
              >
                <div
                  style={{
                    ...styles.dropdownItem,
                    ...(dropdownHoverIndex === 0 ? styles.dropdownItemHover : {}),
                  }}
                  onClick={handleProfileClick}
                  onMouseEnter={() => setDropdownHoverIndex(0)}
                  onMouseLeave={() => setDropdownHoverIndex(-1)}
                >
                  个人资料
                </div>
                <div
                  style={{
                    ...styles.dropdownItemLast,
                    ...(dropdownHoverIndex === 1 ? styles.dropdownItemLastHover : {}),
                  }}
                  onClick={handleLogout}
                  onMouseEnter={() => setDropdownHoverIndex(1)}
                  onMouseLeave={() => setDropdownHoverIndex(-1)}
                >
                  退出登录
                </div>
              </div>
            )}
          </span>
          {/* “发布内容”按钮，仅认证用户可见，采用用户名样式，无下拉菜单 */}
          {isVerifiedTeacher && (
            <>
              <span
                style={{
                  ...styles.username,
                  marginLeft: 24,
                  cursor: 'pointer',
                  color:
                    window.location.pathname === '/uploadcontentpage'
                      ? '#1890ff'
                      : '#fff',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  userSelect: 'none',
                  transition: 'color 0.2s',
                }}
                onClick={() => navigate('/uploadcontentpage')}
                onMouseEnter={e => (e.target.style.color = '#1890ff')}
                onMouseLeave={e => {
                  if (window.location.pathname !== '/uploadcontentpage') {
                    e.target.style.color = '#fff';
                  }
                }}
              >
                发布课程
              </span>
              <span
                style={{
                  ...styles.username,
                  marginLeft: 24,
                  cursor: 'pointer',
                  color:
                    window.location.pathname === '/manage'
                      ? '#1890ff'
                      : '#fff',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  userSelect: 'none',
                  transition: 'color 0.2s',
                }}
                onClick={() => navigate('/manage')}
                onMouseEnter={e => (e.target.style.color = '#1890ff')}
                onMouseLeave={e => {
                  if (window.location.pathname !== '/manage') {
                    e.target.style.color = '#fff';
                  }
                }}
              >
                管理课程
              </span>
            </>
          )}
        </div>
      </Header>

      {/* 主内容 */}
      <Content style={{ ...styles.content, marginTop: '120px' }}>
        <div style={{ background: '#f0f2f5', padding: 24, borderRadius: '8px' }}>{children}</div>
      </Content>

      {/* 页脚 */}
      <Footer style={styles.footer}>
        SnapLearn ©2025 Created by Eaton
      </Footer>

      {showAvatarModal && (
        <div
          style={styles.avatarModalOverlay}
          onClick={() => setShowAvatarModal(false)}
        >
          {avatar
            ? (
              <img
                src={avatar}
                alt="avatar-large"
                style={styles.avatarModalImg}
                onClick={e => e.stopPropagation()}
              />
            )
            : (
              <div
                style={{
                  ...styles.avatarModalImg,
                  background: '#eee',
                  color: '#888',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  fontWeight: 'bold',
                }}
                onClick={e => e.stopPropagation()}
              >
                未设置
              </div>
            )
          }
        </div>
      )}
    </Layout>
  );
};

export default UserLayout;
