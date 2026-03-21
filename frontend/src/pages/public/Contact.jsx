import { useMemo, useState } from 'react';
import emailjs from '@emailjs/browser';
import { FiMail, FiMapPin, FiPhone, FiSend, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import './Contact.css';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

const Contact = () => {
  const [formData, setFormData] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const emailJsConfig = useMemo(
    () => ({
      serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
      templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '',
      publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',
    }),
    []
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      return 'Completá nombre, email, asunto y mensaje.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      return 'Ingresá un email valido.';
    }

    return '';
  };

  const sendContactEmail = async () => {
    const templateParams = {
      from_name: formData.name.trim(),
      from_email: formData.email.trim(),
      from_phone: formData.phone.trim() || 'No informado',
      subject: formData.subject.trim(),
      message: formData.message.trim(),
      reply_to: formData.email.trim(),
    };

    await emailjs.send(emailJsConfig.serviceId, emailJsConfig.templateId, templateParams, {
      publicKey: emailJsConfig.publicKey,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    const validationError = validateForm();
    if (validationError) {
      setStatus({ type: 'error', message: validationError });
      return;
    }

    if (!emailJsConfig.serviceId || !emailJsConfig.templateId || !emailJsConfig.publicKey) {
      setStatus({
        type: 'error',
        message:
          'Falta configurar EmailJS. Definí VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID y VITE_EMAILJS_PUBLIC_KEY.',
      });
      return;
    }

    try {
      setSending(true);
      await sendContactEmail();
      setStatus({ type: 'success', message: 'Tu mensaje se envio correctamente. Te responderemos pronto.' });
      setFormData(initialForm);
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'No pudimos enviar el mensaje en este momento. Intentalo nuevamente en unos minutos.',
      });
      console.error('EmailJS error:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="contact-hero-content">
          <p className="contact-eyebrow">Tejiendo con Andy</p>
          <h1>Contacto</h1>
          <p className="contact-subtitle">
            Si tenés dudas sobre cursos, pagos o acceso, escribime y te respondo personalmente.
          </p>
        </div>
      </section>

      <section className="contact-main-section">
        <div className="contact-container">
          <div className="contact-info-card">
            <h2>Hablemos</h2>
            <p>
              Estoy para ayudarte. Podés escribirme por este formulario o por los siguientes medios de contacto.
            </p>

            <ul className="contact-info-list">
              <li>
                <span className="contact-icon">
                  <FiMail />
                </span>
                <div>
                  <h3>Email</h3>
                  <p>tejiendoconandy@gmail.com</p>
                </div>
              </li>
              <li>
                <span className="contact-icon">
                  <FiPhone />
                </span>
                <div>
                  <h3>Telefono</h3>
                  <p>+54 9 2254538228</p>
                </div>
              </li>
              <li>
                <span className="contact-icon">
                  <FiMapPin />
                </span>
                <div>
                  <h3>Ubicacion</h3>
                  <p>Buenos Aires, Argentina</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="contact-form-card">
            <h2>Enviame un mensaje</h2>
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="contact-form-grid">
                <div className="form-field">
                  <label htmlFor="name">Nombre completo *</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="email">Email *</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div className="contact-form-grid">
                <div className="form-field">
                  <label htmlFor="phone">Telefono</label>
                  <input
                    id="phone"
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Opcional"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="subject">Asunto *</label>
                  <input
                    id="subject"
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Sobre que queres consultar"
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="message">Mensaje *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Contame tu consulta..."
                />
              </div>

              {status.message ? (
                <div className={`contact-status contact-status--${status.type}`}>
                  {status.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                  <span>{status.message}</span>
                </div>
              ) : null}

              <button type="submit" className="contact-submit-btn" disabled={sending}>
                {sending ? 'Enviando...' : 'Enviar mensaje'}
                <FiSend />
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
