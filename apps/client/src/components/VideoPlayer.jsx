import React from 'react';

// Helper function to extract ID from various YouTube URL formats
const getYouTubeId = (url) => {
  if (!url) return null;
  // If it's already just an ID (11 chars, no slashes), return it
  if (!url.includes('/') && !url.includes('.') && url.length === 11) {
    return url;
  }
  // Regex to find ID in URL
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const VideoPlayer = ({ videoId, title = "Video player" }) => {
  const cleanId = getYouTubeId(videoId);

  if (!cleanId) {
    return (
      <div style={{ 
        background: '#000', 
        color: '#fff', 
        aspectRatio: '16/9', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        borderRadius: '12px',
        fontSize: '0.9rem'
      }}>
        Video content unavailable
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'relative', 
      paddingBottom: '56.25%', /* 16:9 Aspect Ratio */ 
      height: 0, 
      overflow: 'hidden', 
      borderRadius: '12px',
      background: '#000',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <iframe
        src={`https://www.youtube.com/embed/${cleanId}`}
        title={title}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 0
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default VideoPlayer;