import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/index';

// 统一的 getCookie 函数
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

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [educationLevel, setEducationLevel] = useState('primary'); // 默认值为小学
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem('token');
    if (isLoggedIn) {
      navigate('/videos'); // 如果已登录，跳转到视频页面
    }
  }, [navigate]);

  const handleRegister = async () => {
    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/users/register/',
        {
          username,
          password,
          email,
          education_level: educationLevel,
        },
        {
          headers: {
            'X-CSRFToken': csrfToken, // 确保带上 CSRF Token
            'Content-Type': 'application/json',
          },
        }
      );
      setSuccess('注册成功！正在自动登录...');
      setError('');

      // 注册成功后自动登录
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        setTimeout(() => {
          navigate('/videos');
        }, 1000);
        return;
      }
      // 若未返回 token，尝试手动登录
      try {
        const loginResp = await axios.post(
          'http://127.0.0.1:8000/users/login/',
          {
            username,
            password,
          },
          {
            headers: {
              'X-CSRFToken': csrfToken,
              'Content-Type': 'application/json',
            },
          }
        );
        if (loginResp.data && loginResp.data.token) {
          localStorage.setItem('token', loginResp.data.token);
          setTimeout(() => {
            navigate('/videos');
          }, 1000);
        } else {
          setError('自动登录失败，请手动登录');
        }
      } catch (loginError) {
        setError('自动登录失败，请手动登录');
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError('注册失败，请稍后重试');
      }
      setSuccess('');
    }
  };

  // 样式对象（与登录页面一致）
  const styles = {
    container: {
      maxWidth: '400px',
      margin: '30px auto', // 水平居中
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
    success: {
      color: 'green',
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
        <h2 style={styles.title}>注  册</h2>
        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}
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
        <div style={styles.inputGroup}>
          <label style={styles.label}>邮箱：</label>
          <input
            type="email"
            placeholder="请输入邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>学历：</label>
          <select
            value={educationLevel}
            onChange={(e) => setEducationLevel(e.target.value)}
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
        <button
          onClick={handleRegister}
          style={styles.button}
          onMouseOver={(e) => (e.target.style.backgroundColor = styles.buttonHover.backgroundColor)}
          onMouseOut={(e) => (e.target.style.backgroundColor = styles.button.backgroundColor)}
        >
          注  册
        </button>
      </div>
    </MainLayout>
  );
}

export default RegisterPage;