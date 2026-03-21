import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Tejiendo con Andy</h3>
          <p>Enseñamos costura desde cero con método práctico y acompañamiento. Transformá hilos en proyectos reales.</p>
        </div>

        <div className="footer-section">
          <h4>Enlaces Rápidos</h4>
          <ul>
            <li><a href="/cursos">Cursos</a></li>
            <li><a href="/como-funciona">Como Funciona</a></li>
            <li><a href="/contacto">Contacto</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contacto</h4>
          <ul className="contact-list">
            <li><FiMail /> tejiendoconandy@gmail.com</li>
            <li><FiPhone /> +54 9 2254538228</li>
            <li><FiMapPin /> Buenos Aires, Argentina</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2025 Tejiendo con Andy. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;