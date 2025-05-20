import React from 'react';
import { Layout, Menu } from 'antd';
import 'antd/dist/reset.css';
import { Link } from 'react-router-dom';

const { Header, Content, Footer } = Layout;

const MainLayout = ({ children }) => {
  const styles = {
    header: {
      position: 'fixed',
      zIndex: 1,
      width: '100%',
      backgroundColor: '#001529',
      display: 'flex',
      alignItems: 'center',
      padding: '60px 60px',
    },
    logo: {
      color: '#fff',
      fontSize: '20px',
      fontWeight: 'bold',
      marginRight: 'auto',
    },
    content: {
      padding: '24px 50px',
      marginTop: '124px', // 增加顶部间距，避免被 header 遮挡
      flex: 1,
      backgroundColor: '#f0f2f5',
      minHeight: 'calc(100vh - 184px)', // header+footer高度
    },
    footer: {
      textAlign: 'center',
      backgroundColor: '#001529',
      color: '#fff',
      padding: '10px 0',
    },
    menu: {
      border: 'none',
      backgroundColor: 'transparent',
    },
    menuItem: {
      color: '#fff',
      fontSize: '16px',
    },
  };

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 页眉 */}
      <Header style={styles.header}>
        <div style={styles.logo}>SnapLearn</div>
        <Menu mode="horizontal" style={styles.menu} theme="dark">
          <Menu.Item key="login">
            <Link to="/login" style={styles.menuItem}>
              登录
            </Link>
          </Menu.Item>
          <Menu.Item key="register">
            <Link to="/register" style={styles.menuItem}>
              注册
            </Link>
          </Menu.Item>
        </Menu>
      </Header>

      {/* 主内容 */}
      <Content style={styles.content}>
        <div style={{ background: '#f0f2f5', padding: 60, borderRadius: '8px' }}>{children}</div>
      </Content>

      {/* 页脚 */}
      <Footer style={styles.footer}>
        SnapLearn ©2025 Created by Eaton
      </Footer>
    </Layout>
  );
};

export default MainLayout;
