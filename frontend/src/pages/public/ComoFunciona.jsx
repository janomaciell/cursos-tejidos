import { Link } from 'react-router-dom';
import {
  FiPlay,
  FiShield,
  FiCheckCircle,
  FiClock,
  FiHeadphones,
  FiArrowLeft,
} from 'react-icons/fi';
import Button from '../../components/common/Button';
import './ComoFunciona.css';

const ComoFunciona = () => {
  return (
    <div className="como-funciona-page">
      <header className="cf-header">
        <div className="cf-header-inner">
          <Link to="/" className="cf-back">
            <FiArrowLeft />
            <span>Volver al inicio</span>
          </Link>
          <h1 className="cf-main-title">Cómo funciona</h1>
          <p className="cf-main-subtitle">
            Todo lo que necesitás saber sobre los cursos, cómo comprar con confianza y quiénes somos.
          </p>
        </div>
      </header>

      {/* Sección lista para video en el futuro */}
      <section className="cf-video-section">
        <div className="cf-video-container">
          <h2 className="cf-section-title">Mirá cómo funciona</h2>
          <p className="cf-section-subtitle">
            En este video te cuento en pocos minutos cómo es la plataforma y cómo podés aprovechar al máximo los cursos.
          </p>
          <div className="cf-video-wrapper">
            <div className="cf-video-placeholder">
              <div className="cf-video-poster">
                <FiPlay className="cf-video-play-icon" />
                <span className="cf-video-placeholder-text">Video próximamente</span>
              </div>
            </div>
            {/* Cuando tengas el video, reemplazá el div anterior por:
                <iframe src="https://www.youtube.com/embed/TU_VIDEO_ID" title="Cómo funciona" allowFullScreen /> */}
          </div>
        </div>
      </section>

      {/* Cómo funcionan los cursos y comprar con confianza */}
      <section className="cf-courses-trust-section">
        <div className="cf-container">
          <h2 className="cf-section-title">Cursos y compra con confianza</h2>
          <p className="cf-section-subtitle">
            Cómo funcionan los cursos y todo lo que necesitás para comprar tranquila.
          </p>

          <div className="cf-block">
            <h3 className="cf-block-title">Cómo funcionan los cursos</h3>
            <p className="cf-intro">
              Nuestros cursos son 100% online. Una vez que te inscribís, tenés acceso inmediato a todo el contenido
              para verlo cuando quieras, las veces que quieras, de por vida.
            </p>
            <ul className="cf-steps-list">
              <li>
                <strong>Elegí tu curso:</strong> Explorá el catálogo, leé la descripción y los temas. Podés empezar por
                el que mejor se adapte a tu nivel (inicial, intermedio o avanzado).
              </li>
              <li>
                <strong>Registrate o iniciá sesión:</strong> Creá tu cuenta en la plataforma en pocos pasos. Si ya tenés
                cuenta, solo iniciá sesión.
              </li>
              <li>
                <strong>Comprá de forma segura:</strong> El pago se procesa de manera segura. Una vez confirmado, el curso
                se asigna a tu cuenta al instante.
              </li>
              <li>
                <strong>Accedé al contenido:</strong> Entrá a “Mis cursos” desde tu panel y encontrá todas las lecciones
                en video, material descargable y, según el curso, soporte para consultas.
              </li>
              <li>
                <strong>Avanzá a tu ritmo:</strong> No hay fechas límite. Mirá las clases cuando puedas, practicá y
                volvé a verlas las veces que necesites.
              </li>
              <li>
                <strong>Certificado:</strong> Al completar el curso, obtenés un certificado que avala tu aprendizaje.
              </li>
            </ul>
          </div>

          <div className="cf-block">
            <h3 className="cf-block-title">Cómo comprar con confianza</h3>
            <p className="cf-intro">
              Queremos que te sientas tranquila desde el primer clic. Por eso trabajamos con pasarelas de pago seguras
              y políticas claras.
            </p>
            <div className="cf-trust-grid">
              <div className="cf-trust-card">
                <div className="cf-trust-icon"><FiShield /></div>
                <h4>Pago seguro</h4>
                <p>Tu información de pago está protegida. No guardamos datos de tarjetas en nuestros servidores.</p>
              </div>
              <div className="cf-trust-card">
                <div className="cf-trust-icon"><FiCheckCircle /></div>
                <h4>Garantía de 30 días</h4>
                <p>Si el curso no cumple tus expectativas, podés solicitar la devolución en los primeros 30 días.</p>
              </div>
              <div className="cf-trust-card">
                <div className="cf-trust-icon"><FiClock /></div>
                <h4>Acceso inmediato</h4>
                <p>Tras confirmarse el pago, el curso queda disponible en tu cuenta al instante.</p>
              </div>
              <div className="cf-trust-card">
                <div className="cf-trust-icon"><FiHeadphones /></div>
                <h4>Soporte humano</h4>
                <p>Ante cualquier duda antes o después de comprar, podés escribirnos y te respondemos.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nosotros */}
      <section className="cf-nosotros-section">
        <div className="cf-container cf-nosotros-inner">
          <div className="cf-nosotros-content">
            <h2 className="cf-section-title">Nosotros</h2>
            <p className="cf-nosotros-lead">
              Lo hacemos por pasión y porque amamos lo que hacemos.
            </p>
            <p className="cf-nosotros-text">
              Tejiendo con Andy nació del deseo de compartir algo que nos mueve por dentro: la costura y el tejido no son
              solo técnicas, son una forma de conectar con uno mismo, de crear con las manos y de dar vida a ideas que
              antes solo existían en la cabeza.
            </p>
            <p className="cf-nosotros-text">
              Creemos que aprender a coser o tejer puede cambiar la vida de muchas personas. Por eso dedicamos tiempo,
              cuidado y mucho cariño a cada curso: para que cualquier persona, sin importar su edad o experiencia previa,
              pueda sentirse capaz de lograr lo que se proponga.
            </p>
            <p className="cf-nosotros-text">
              Nuestra historia es la de hacer lo que amamos y compartirlo con vos. Cada alumna que termina su primera
              prenda o su primer proyecto nos inspira a seguir mejorando y a seguir enseñando con la misma ilusión del
              primer día.
            </p>
            <div className="cf-nosotros-values">
              <span className="cf-value">Pasión</span>
              <span className="cf-value">Compromiso</span>
              <span className="cf-value">Comunidad</span>
            </div>
          </div>
          <div className="cf-nosotros-visual">
            <div className="cf-nosotros-box" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cf-cta-section">
        <div className="cf-cta-inner">
          <h2 className="cf-cta-title">¿Lista para empezar?</h2>
          <p className="cf-cta-text">Explorá los cursos y elegí el que mejor se adapte a vos.</p>
          <Link to="/cursos">
            <Button size="large" className="cf-cta-btn">
              Ver cursos
              <FiArrowLeft style={{ transform: 'rotate(180deg)' }} />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ComoFunciona;
