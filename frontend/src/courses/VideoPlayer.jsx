import { useState, useEffect, useRef } from 'react';
import { Stream } from '@cloudflare/stream-react';
import { videosAPI } from '../api/videos';
import Loader from '../components/common/Loader';
import './VideoPlayer.css';

const VideoPlayer = ({ lessonId, onProgress }) => {
  const [videoId, setVideoId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);
  const progressInterval = useRef(null);

  useEffect(() => {
    loadVideo();
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [lessonId]);

  const extractVideoId = (url) => {
    if (!url) return null;
    // Extraer de: https://customer-xxx.cloudflarestream.com/{videoId}/manifest/...
    const match = url.match(/cloudflarestream\.com\/([a-f0-9]+)\//);
    return match ? match[1] : null;
  };

  const loadVideo = async () => {
    try {
      setLoading(true);
      setVideoId(null);
      const data = await videosAPI.getVideoToken(lessonId);
      // Usar video_id directo si está disponible, sino extraer de la URL
      const id = data.video_id ?? extractVideoId(data.video_url);
      if (!id) throw new Error('No se pudo obtener el ID del video');
      setVideoId(id);
      setError(null);
    } catch (err) {
      setError('Error al cargar el video');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = () => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    progressInterval.current = setInterval(() => {
      if (streamRef.current) {
        const { currentTime, duration } = streamRef.current;
        if (duration > 0) {
          const pct = Math.floor((currentTime / duration) * 100);
          if (onProgress && !isNaN(pct)) onProgress(pct);
        }
      }
    }, 10000); // Reportar progreso cada 10 segundos
  };

  const handlePause = () => {
    // Guardar progreso al pausar
    if (streamRef.current && onProgress) {
      const { currentTime, duration } = streamRef.current;
      if (duration > 0) {
        const pct = Math.floor((currentTime / duration) * 100);
        if (!isNaN(pct)) onProgress(pct);
      }
    }
    if (progressInterval.current) clearInterval(progressInterval.current);
  };

  const handleEnded = () => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    if (onProgress) onProgress(100);
  };

  if (loading) return (
    <div className="video-player-loading">
      <Loader size="large" />
      <p>Cargando video...</p>
    </div>
  );

  if (error || !videoId) return (
    <div className="video-player-error">
      <p>{error ?? 'Video no disponible'}</p>
    </div>
  );

  return (
    <div className="video-player">
      <Stream
        src={videoId}
        streamRef={streamRef}
        controls
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        className="video-element"
      />
    </div>
  );
};

export default VideoPlayer;