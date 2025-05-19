import React from 'react';

/**
 * 通用头像组件
 * @param {string} src 头像图片地址
 * @param {boolean} isCertified 是否认证
 * @param {number} size 头像尺寸（px）
 * @param {string} alt alt文本
 * @param {object} style 额外样式
 * @param {function} onClick 点击事件
 */
function CertifiedAvatar({ src, isCertified, size = 60, alt = 'avatar', style = {}, onClick }) {
  const hasAvatar = !!src;
  return (
    <div style={{ position: 'relative', display: 'inline-block', verticalAlign: 'middle', ...style }} onClick={onClick}>
      {hasAvatar ? (
        <img
          src={src}
          alt={alt}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid #fff',
            background: '#eee',
            cursor: onClick ? 'pointer' : 'default',
            display: 'block'
          }}
          draggable={false}
        />
      ) : (
        <img
          src="/logo192.png"
          alt="默认头像"
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid #fff',
            background: '#eee',
            cursor: onClick ? 'pointer' : 'default',
            display: 'block'
          }}
          draggable={false}
        />
      )}
      {/* 头像下方认证图标替换为 certification.png */}
      {isCertified && (
        <img
          src="/certification.png"
          alt="认证"
          onError={e => { e.target.style.display = 'none'; }}
          style={{
            position: 'absolute',
            left: '45%',
            top: '-50%',
            transform: 'translateX(-50%) translateY(-8px)',
            width: 80,
            height: 80,
            zIndex: 10,
            pointerEvents: 'none',
            background: 'transparent',
          }}
          draggable={false}
        />
      )}
    </div>
  );
}

export default CertifiedAvatar;
