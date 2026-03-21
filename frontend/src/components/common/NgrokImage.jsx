import { useEffect, useState } from 'react';
import api from '../../api/axios';

/**
 * Imagen que carga a través de la API Axios para poder
 * enviar el header `ngrok-skip-browser-warning` y evitar
 * que ngrok devuelva la página de advertencia en lugar de la imagen.
 */
const NgrokImage = ({ src, alt, className, ...rest }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    if (!src) {
      setImageSrc(null);
      setHasError(false);
      return;
    }

    const loadImage = async () => {
      try {
        // Importante: nuestro axios tiene baseURL = .../api
        // Si src viene como "/media/..." y usamos api.get("/media/..."),
        // Axios lo concatena y termina en ".../api/media/..." (404).
        // Por eso, siempre normalizamos a una URL absoluta contra el baseURL.
        const url = /^https?:\/\//i.test(src)
          ? src
          : new URL(src, api.defaults.baseURL).toString();

        const response = await api.get(url, {
          responseType: 'blob',
        });

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
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  // Si falla la portada remota, mostramos un fallback visible
  // para evitar tarjetas vacías en producción.
  if (hasError || !imageSrc) {
    return (
      <img
        src="/img/logoheader.png"
        alt={alt || 'Portada no disponible'}
        className={className}
        {...rest}
      />
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      {...rest}
    />
  );
};

export default NgrokImage;

