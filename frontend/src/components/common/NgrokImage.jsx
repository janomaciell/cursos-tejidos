import { useEffect, useState } from 'react';
import api from '../../api/axios';

const NgrokImage = ({ src, alt, className, ...rest }) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const isNgrok = API_URL.includes('ngrok');
  const [imageSrc, setImageSrc] = useState(null);
  const [hasError, setHasError] = useState(false);

  // Si la URL es absoluta externa (R2, S3, etc.), no necesita pasar por Axios
  const isExternalUrl = src?.startsWith('http://') || src?.startsWith('https://');

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    if (!src || isExternalUrl) {
      setImageSrc(null);
      setHasError(false);
      return;
    }

    const loadImage = async () => {
      try {
        const response = await api.get(src, { responseType: 'blob' });
        if (cancelled) return;
        objectUrl = URL.createObjectURL(response.data);
        setImageSrc(objectUrl);
        setHasError(false);
      } catch (error) {
        if (!cancelled) {
          setHasError(true);
          setImageSrc(null);
        }
      }
    };

    loadImage();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, isExternalUrl]);

  // URLs externas (R2) — img directo, sin Axios, sin ngrok header
  if (isExternalUrl) {
    if (!src || hasError) return <div className={className} {...rest} />;
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onError={() => setHasError(true)}
        {...rest}
      />
    );
  }

  // Sin ngrok — img directo (Vite proxya /media → backend)
  if (!isNgrok) {
    if (!src || hasError) return <div className={className} {...rest} />;
    return <img src={src} alt={alt} className={className} {...rest} />;
  }

  // Con ngrok y URL relativa — carga via Axios blob
  if (hasError || !imageSrc) {
    return <div className={className} {...rest} />;
  }

  return <img src={imageSrc} alt={alt} className={className} {...rest} />;
};

export default NgrokImage;