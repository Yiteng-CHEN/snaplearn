import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'antd/dist/reset.css';
import App from './App';

// 获取根节点
const root = ReactDOM.createRoot(document.getElementById('root'));

// 渲染 App 组件
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
