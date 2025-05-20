import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/index';

const getCookie = (name) => {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

const csrfToken = getCookie('csrftoken');

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem('token');
    if (isLoggedIn) {
      navigate('/videos', { replace: true }); // 用 replace 避免历史记录堆叠
    }
  }, [navigate]);

  const isLoggedIn = !!localStorage.getItem('token');
  if (isLoggedIn) {
    return null; // 已登录时不渲染登录页面，防止跳转抖动
  }

  const handleLogin = async () => {
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/users/login/',
        {
          username,
          password,
        },
        {
          headers: {
            'X-CSRFToken': csrfToken, // 已带上 CSRF Token
            'Content-Type': 'application/json',
          },
        }
      );

      const { token, role } = response.data;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        // 登录成功后根据角色跳转
        if (role === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/videos';
        }
      } else {
        setError('登录失败，未获取到token');
      }
    } catch (error) {
      if (error.response && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError('登录失败，请稍后重试');
      }
    }
  };

  // 样式对象
  const styles = {
    container: {
      maxWidth: '400px',
      margin: '60px auto', // 水平居中
      padding: '60px',
      background: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      display: 'flex', // 使用 flexbox
      flexDirection: 'column', // 垂直排列内容
      justifyContent: 'center', // 垂直居中
      alignItems: 'center', // 水平居中
      minHeight: '60vh', // 占满整个视口高度
    },
    title: {
      textAlign: 'center',
      marginBottom: '60px',
    },
    error: {
      color: 'red',
      textAlign: 'center',
      marginBottom: '10px',
    },
    inputGroup: {
      marginBottom: '15px',
      width: '100%', // 确保输入框宽度占满容器
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
    button: {
      width: '100%',
      marginTop: '60px',
      padding: '10px',
      backgroundColor: '#170917',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    buttonHover: {
      backgroundColor: '#890925',
    },
  };

  return (
    <MainLayout>
      <div style={styles.container}>
        <h2 style={styles.title}>登  录</h2>
        {error && <p style={styles.error}>{error}</p>}
        <div style={styles.inputGroup}>
          <label style={styles.label}>用户名：</label>
          <input
            type="text"
            placeholder="请输入用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>密码：</label>
          <input
            type="password"
            placeholder="请输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
        </div>
        <button
          onClick={handleLogin}
          style={styles.button}
          onMouseOver={(e) => (e.target.style.backgroundColor = styles.buttonHover.backgroundColor)}
          onMouseOut={(e) => (e.target.style.backgroundColor = styles.button.backgroundColor)}
        >
          登  录
        </button>
      </div>
    </MainLayout>
  );
}

export default LoginPage;