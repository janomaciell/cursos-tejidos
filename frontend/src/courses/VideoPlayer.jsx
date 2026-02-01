import { useState, useEffect, useRef } from 'react';
import { videosAPI } from '../api/videos';
import Loader from '../components/common/Loader';
import './VideoPlayer.css';

const VideoPlayer = ({ lessonId, onProgress }) => {
  const [videoUrl, setVideoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const progressInterval = useRef(null);

  useEffect(() => {
    loadVideo();
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [lessonId]);

  const loadVideo = async () => {
    try {
      setLoading(true);
      const data = await videosAPI.getVideoToken(lessonId);
      setVideoUrl(data.video_url);
      setError(null);
    } catch (err) {
      setError('Error al cargar el video');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = () => {
    // Actualizar progreso cada 10 segundos
    progressInterval.current = setInterval(() => {
      if (videoRef.current) {
        const currentTime = videoRef.current.currentTime;
        const duration = videoRef.current.duration;
        const progress = Math.floor((currentTime / duration) * 100);
        
        if (onProgress && !isNaN(progress)) {
          onProgress(progress);
        }
      }
    }, 10000);
  };

  const handlePause = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
  };

  const handleEnded = () => {
    if (onProgress) {
      onProgress(100);
    }
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
  };

  if (loading) {
    return (
      <div className="video-player-loading">
        <Loader size="large" />
        <p>Cargando video...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="video-player-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        controlsList="nodownload"
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        className="video-element"
      >
        Tu navegador no soporta el elemento de video.
      </video>
    </div>
  );
};

export default VideoPlayer;