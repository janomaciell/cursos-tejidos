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
        // Si la URL ya es relativa al backend (/media/...), dejarla tal cual.
        const url = src;

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

  // Si hay error o aún no cargó, dejamos que el contenedor muestre solo el background.
  if (hasError || !imageSrc) {
    return <div className={className} {...rest} />;
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

