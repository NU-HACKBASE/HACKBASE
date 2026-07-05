import React from 'react';

export default function OgpTemplate() {
  const styles = {
    body: {
      width: '1200px',
      height: '630px',
      background: 'radial-gradient(circle at 80% 20%, #1a103c 0%, #05070f 100%)',
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 100px',
      overflow: 'hidden',
      position: 'relative',
      boxSizing: 'border-box',
    },
    iconContainer: {
      width: '420px',
      height: '420px',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    // 後ろからボワッと光るネオンエフェクト
    glow: {
      position: 'absolute',
      inset: '-15px',
      background: 'linear-gradient(45deg, #00f2ff, #9d00ff)',
      borderRadius: '100px',
      filter: 'blur(30px)',
      opacity: 0.6,
      zIndex: 1,
    },
    iconImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: '90px',
      position: 'relative',
      zIndex: 2,
      border: '2px solid rgba(255, 255, 255, 0.1)',
    },
    textContainer: {
      width: '540px',
      color: '#ffffff',
      zIndex: 2,
      textAlign: 'left',
    },
    tag: {
      display: 'inline-block',
      background: 'linear-gradient(90deg, rgba(0, 242, 255, 0.2), rgba(157, 0, 255, 0.2))',
      border: '1px solid #00f2ff',
      color: '#00f2ff',
      padding: '6px 16px',
      borderRadius: '20px',
      fontSize: '18px',
      fontWeight: 'bold',
      letterSpacing: '2px',
      marginBottom: '24px',
      textShadow: '0 0 10px #00f2ff',
    },
    title: {
      fontSize: '56px',
      fontWeight: 900,
      lineHeight: 1.3,
      marginBottom: '20px',
      background: 'linear-gradient(135deg, #ffffff 60%, #c5b3ff 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    description: {
      fontSize: '22px',
      color: '#a0a5c0',
      lineHeight: 1.6,
      fontWeight: 500,
    }
  };

  return (
    <div style={styles.body}>
      <div style={styles.iconContainer}>
        <div style={styles.glow}></div>
        <img src="/pandaicon.jpg" alt="Icon" style={styles.iconImage} />
      </div>
      <div style={styles.textContainer}>
        <div style={styles.tag}>NEW RELEASE</div>
        <div style={styles.title}>次世代の<br />位置情報SNS。</div>
        <div style={styles.description}>
          パンダのマップピンが、あなたと大切な友達をリアルタイムに繋ぐ。今までにないお出かけ体験を。
        </div>
      </div>
    </div>
  );
}