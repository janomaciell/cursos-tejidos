import { useEffect, useRef, useState } from 'react';

const GSI_SCRIPT = 'https://accounts.google.com/gsi/client';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      if (window.google?.accounts?.id) return resolve();
      const check = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(check);
          resolve();
        }
      }, 50);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Error cargando Google Sign-In'));
    document.head.appendChild(script);
  });
}

export default function GoogleLoginButton({ onSuccess, onError, disabled = false }) {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    if (!clientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID no configurado');
      return;
    }
    let mounted = true;
    loadScript(GSI_SCRIPT)
      .then(() => {
        if (!mounted || !window.google?.accounts?.id || !containerRef.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              onSuccess?.(response.credential);
            } else {
              onError?.('No se obtuvo credencial de Google');
            }
          },
          auto_select: false,
        });
        const width = containerRef.current?.offsetWidth || 320;
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: Math.max(280, width),
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        });
        setReady(true);
      })
      .catch((err) => {
        console.error(err);
        onError?.(err.message);
      });
    return () => { mounted = false; };
  }, [clientId, onSuccess, onError]);

  if (!clientId) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="google-button-container"
      style={{ minHeight: 44, opacity: ready ? 1 : 0.6 }}
      aria-hidden={disabled}
    />
  );
}
