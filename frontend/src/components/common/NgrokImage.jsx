import { useEffect, useState } from 'react';
import api from '../../api/axios';

/**
 * Imagen que carga a través de la API Axios para poder
 * enviar el header `ngrok-skip-browser-warning` y evitar
 * que ngrok devuelva la página de advertencia en lugar de la imagen.
 */
const makeFallbackSvg = (label = 'Curso') => {
  const safeLabel = String(label || 'Curso').slice(0, 40);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750" viewBox="0 0 1200 750">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fc5c0d" />
          <stop offset="100%" stop-color="#c2412d" />
        </linearGradient>
      </defs>
      <rect width="1200" height="750" fill="url(#bg)" />
      <text x="600" y="350" text-anchor="middle" fill="#ffffff" font-size="52" font-family="Inter, Arial, sans-serif" font-weight="700">
        Portada no disponible
      </text>
      <text x="600" y="430" text-anchor="middle" fill="#ffffff" opacity="0.9" font-size="40" font-family="Inter, Arial, sans-serif">
        ${safeLabel}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const NgrokImage = ({ src, alt, className, ...rest }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);

  useEffect(() => {
    if (!src) {
      setImageSrc(makeFallbackSvg(alt));
      setFallbackUsed(true);
      return;
    }

    const url = /^https?:\/\//i.test(src)
      ? src
      : new URL(src, api.defaults.baseURL).toString();

    setImageSrc(url);
    setFallbackUsed(false);
  }, [src, alt]);

  return (
    <img
      src={imageSrc}
      alt={alt || 'Portada del curso'}
      className={className}
      onError={() => {
        if (!fallbackUsed) {
          setImageSrc(makeFallbackSvg(alt));
          setFallbackUsed(true);
        }
      }}
      {...rest}
    />
  );
};

export default NgrokImage;

