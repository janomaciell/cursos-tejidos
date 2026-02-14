import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { coursesAPI } from '../../api/courses';
import Button from '../../components/common/Button';
import { 
  FiArrowRight, 
  FiBook, 
  FiClock, 
  FiHeadphones, 
  FiCheck,
  FiAward,
  FiStar,
  FiEdit2,
  FiZap,
  FiHeart,
  FiUsers,
  FiTrendingUp
} from 'react-icons/fi';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Home.css';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [latestCourses, setLatestCourses] = useState([]);
  const canvasRef = useRef(null);
  const threadsRef = useRef([]);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    loadLatestCourses();
  }, []);

  useEffect(() => {
    // Initialize thread animation
    initThreadAnimation();
    
    // Cleanup on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Handle scroll to hide threads
    const handleScroll = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const heroSection = document.querySelector('.hero-section');
      if (!heroSection) return;
      
      const heroHeight = heroSection.offsetHeight;
      
      if (scrollTop > heroHeight * 0.7) {
        canvas.style.opacity = Math.max(0, 1 - (scrollTop - heroHeight * 0.7) / (heroHeight * 0.3));
      } else {
        canvas.style.opacity = 1;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Initialize Urbanist section animation
    const initUrbanistAnimation = () => {
      const panes = gsap.utils.toArray(".urbanist-pane");
      const panesContainer = document.getElementById("urbanist-panes-container");
      const urbanistWrapper = document.querySelector(".urbanist-wrapper");
      
      if (!panesContainer || panes.length === 0 || !urbanistWrapper) return;

      const containerWidth = panesContainer.offsetWidth;

      const themes = [
        {
          mainBg: "#fff58c",
          subBg: "#fbf1ed",
          text: "#9c4e23",
          title: "#9c4e23"
        },
        {
          mainBg: "#c4ffb2",
          subBg: "#f1ffec",
          text: "#164c3b",
          title: "#164c3b"
        },
        {
          mainBg: "#8b2635",
          subBg: "#fce8ea",
          text: "#2d0a0f",
          title: "#b83a4d"
        },
        {
          mainBg: "#5dd4d4",
          subBg: "#e8fafa",
          text: "#0d3d3d",
          title: "#2ba3a3"
        }
      ];

      const thresholds = new Array(panes.length)
        .fill(0)
        .map((_, i) => parseFloat(((1 / panes.length) * i).toFixed(2)));

      let activeThemeIndex = 0;

      gsap.set(panes, {
        width: containerWidth / panes.length
      });

      const paneWidth = panes[0].offsetWidth;

      gsap.to(panes, {
        x: -paneWidth * (panes.length - 1),
        ease: "none",
        scrollTrigger: {
          trigger: urbanistWrapper,
          pin: true,
          scrub: 1,
          onUpdate: (self) => {
            const progress = parseFloat(self.progress.toFixed(2));
            const themeIndex = thresholds.findLastIndex(
              (threshold) => progress >= threshold
            );
            if (themeIndex === activeThemeIndex) return;
            activeThemeIndex = themeIndex;
            
            // Update theme only for urbanist section
            const theme = themes[themeIndex];
            gsap.to(urbanistWrapper, {
              "--urbanist-main-bg": theme.mainBg,
              "--urbanist-sub-bg": theme.subBg,
              "--urbanist-title": theme.title,
              "--urbanist-text": theme.text,
              duration: 1,
              ease: "power2.out"
            });
          },
          end: () => "+=" + containerWidth
        }
      });
    };

    initUrbanistAnimation();

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  useEffect(() => {
    const revealSections = gsap.utils.toArray('.home-reveal');
    const triggers = [];
    revealSections.forEach((section) => {
      const tween = gsap.fromTo(section,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
      if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
    });
    return () => triggers.forEach((t) => t.kill());
  }, []);

  const loadLatestCourses = async () => {
    try {
      const data = await coursesAPI.getAllCourses();
      const list = Array.isArray(data) ? data : (data?.results ?? []);
      setLatestCourses(list.slice(0, 3));
    } catch (error) {
      console.error('Error al cargar últimos cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Thread Animation Logic - Improved version with Verlet physics
  const initThreadAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;

    const threadCount = 15;
    const colors = ['#fc5c0d', '#fe6308', '#c2412d', '#e4c4b5', '#ffffff'];

    // Thread class with Verlet integration
    class Thread {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = -50;
        this.points = [];
        this.pointCount = 25;
        this.segmentLength = height / (this.pointCount - 5);
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.thickness = Math.random() * 2 + 0.5;
        this.opacity = Math.random() * 0.4 + 0.2;
        
        this.gravity = 0.05;
        this.friction = 0.98;
        this.wind = (Math.random() - 0.5) * 0.02;

        // Initialize points with Verlet integration
        for (let i = 0; i < this.pointCount; i++) {
          this.points.push({
            x: this.x,
            y: this.y + i * this.segmentLength,
            oldX: this.x,
            oldY: this.y + i * this.segmentLength,
            pinned: i === 0
          });
        }
      }

      update() {
        // Update point positions using Verlet integration
        for (let i = 0; i < this.pointCount; i++) {
          const p = this.points[i];
          if (!p.pinned) {
            const vx = (p.x - p.oldX) * this.friction;
            const vy = (p.y - p.oldY) * this.friction;

            p.oldX = p.x;
            p.oldY = p.y;
            p.x += vx + this.wind + (Math.sin(Date.now() * 0.001 + this.x) * 0.05);
            p.y += vy + this.gravity;
          }
        }

        // Constraint satisfaction - multiple iterations for stability
        for (let j = 0; j < 5; j++) {
          for (let i = 0; i < this.pointCount - 1; i++) {
            const p1 = this.points[i];
            const p2 = this.points[i + 1];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const difference = this.segmentLength - distance;
            const percent = difference / distance / 2;
            const offsetX = dx * percent;
            const offsetY = dy * percent;

            if (!p1.pinned) {
              p1.x -= offsetX;
              p1.y -= offsetY;
            }
            p2.x += offsetX;
            p2.y += offsetY;
          }
        }
      }

      draw() {
        // Draw smooth curves using quadratic curves
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        
        for (let i = 1; i < this.pointCount - 2; i++) {
          const xc = (this.points[i].x + this.points[i + 1].x) / 2;
          const yc = (this.points[i].y + this.points[i + 1].y) / 2;
          ctx.quadraticCurveTo(this.points[i].x, this.points[i].y, xc, yc);
        }

        ctx.quadraticCurveTo(
          this.points[this.pointCount - 2].x,
          this.points[this.pointCount - 2].y,
          this.points[this.pointCount - 1].x,
          this.points[this.pointCount - 1].y
        );

        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.thickness;
        ctx.globalAlpha = this.opacity;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Mouse interaction
      applyMouseForce(mouseX, mouseY) {
        this.points.forEach(p => {
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const angle = Math.atan2(dy, dx);
            const force = (150 - dist) / 150;
            p.x -= Math.cos(angle) * force * 8;
            p.y -= Math.sin(angle) * force * 8;
          }
        });
      }
    }

    // Create threads
    const createThreads = () => {
      threadsRef.current = [];
      for (let i = 0; i < threadCount; i++) {
        threadsRef.current.push(new Thread());
      }
    };

    // Set canvas size and recreate threads on resize
    const resizeCanvas = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      createThreads();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse interaction handler
    const handleMouseMove = (e) => {
      threadsRef.current.forEach(thread => {
        thread.applyMouseForce(e.clientX, e.clientY);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      threadsRef.current.forEach(thread => {
        thread.update();
        thread.draw();
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  };

  const formatDuration = (hours) => {
    if (hours == null || hours === undefined) return '—';
    if (hours < 24) return `${Math.round(hours)} horas`;
    const weeks = Math.round(hours / 4);
    return weeks <= 1 ? `${Math.round(hours)} horas` : `${weeks} semanas`;
  };

  const difficultyLabel = (d) => {
    const map = { beginner: 'Inicial', intermediate: 'Intermedio', advanced: 'Avanzado' };
    return (d && map[d]) ? map[d] : (d || 'Curso');
  };

  const steps = [
    { number: '01', title: 'Inscribite', desc: 'Elegí tu curso ideal' },
    { number: '02', title: 'Accedé', desc: 'A todo el contenido 24/7' },
    { number: '03', title: 'Practicá', desc: 'Con proyectos reales' },
    { number: '04', title: 'Consultá', desc: 'Soporte personalizado' },
    { number: '05', title: 'Certificá', desc: 'Tu nueva habilidad' }
  ];

  const benefits = [
    { icon: <FiBook />, title: 'Clases paso a paso', desc: 'Videos HD detallados y fáciles de seguir' },
    { icon: <FiClock />, title: 'Acceso de por vida', desc: 'Aprendé a tu ritmo, sin presiones' },
    { icon: <FiHeadphones />, title: 'Soporte directo', desc: 'Resuelvo tus dudas personalmente' },
    { icon: <FiCheck />, title: 'Proyectos prácticos', desc: 'Creá piezas profesionales desde día 1' },
    { icon: <FiAward />, title: 'Certificado', desc: 'Validá tu aprendizaje oficialmente' }
  ];

  const testimonials = [
    {
      text: 'Nunca imaginé que podría hacer mis propias prendas. Andy explica todo con tanta claridad que me sentí acompañada en cada paso. Ahora tengo mi propio emprendimiento.',
      author: 'María González',
      role: 'Emprendedora textil'
    },
    {
      text: 'Empecé sin saber nada y ahora diseño mi propia ropa. Los cursos cambiaron mi vida completamente. La comunidad que Andy ha creado es increíble.',
      author: 'Laura Martínez',
      role: 'Diseñadora independiente'
    },
    {
      text: 'La moldería siempre me pareció imposible, pero con este método lo entendí perfectamente. ¡Ahora creo mis propios diseños y hago ropa a medida para toda mi familia!',
      author: 'Sofía Rodríguez',
      role: 'Modista profesional'
    }
  ];

  const experiences = [
    {
      icon: <FiStar />,
      title: 'Confianza Creativa',
      description: 'Desde la primera clase sentirás cómo crece tu confianza. Ver tus manos creando algo hermoso genera una satisfacción indescriptible.'
    },
    {
      icon: <FiEdit2 />,
      title: 'Expresión Personal',
      description: 'Aprende a materializar tus ideas en telas y puntadas. Cada proyecto es una oportunidad para expresar tu estilo único.'
    },
    {
      icon: <FiZap />,
      title: 'Independencia',
      description: 'Imagina poder arreglar cualquier prenda, crear tu guardarropa ideal o incluso iniciar tu propio emprendimiento.'
    },
    {
      icon: <FiHeart />,
      title: 'Terapia y Mindfulness',
      description: 'Coser es meditativo. El ritmo de las puntadas y ver el progreso constante tiene un efecto calmante incomparable.'
    },
    {
      icon: <FiUsers />,
      title: 'Conexión Humana',
      description: 'Únete a una comunidad vibrante donde compartimos proyectos, resolvemos dudas y celebramos cada logro juntas.'
    },
    {
      icon: <FiTrendingUp />,
      title: 'Crecimiento Constante',
      description: 'Cada proyecto es un desafío que te empuja a mejorar. Verás tu progreso semana a semana en cada puntada.'
    }
  ];

  return (
    <div className="home-page">
      {/* Hero Section with Thread Animation */}
      <section className="hero-section">
        <canvas ref={canvasRef} id="threadCanvas"></canvas>
        <div className="hero-content">
          <p className="hero-subtitle">El Arte de Crear con tus Manos</p>
          <h1 className="hero-title">
            Tejiendo con Andy:<br />Transforma Hilos en Sueños
          </h1>
          <p className="hero-description">
            Descubre la magia de la costura en un espacio diseñado para que tu creatividad florezca. 
            Aprende, crea y conecta en una experiencia que nutre el alma.
          </p>
          <div className="hero-buttons">
            <Link to="/cursos">
              <Button size="large" className="btn-primary">
                Ver Cursos
              </Button>
            </Link>
            <Link to="/cursos">
              <Button size="large" className="btn-primary">
                Saber más
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section home-reveal">
        <div className="mission-container">
          <div className="mission-content">
            <h2>No solo enseñamos a coser,<br /><span className="highlight">transformamos vidas</span></h2>
            <p>
              En Tejiendo con Andy, creemos que la costura es mucho más que una habilidad técnica. 
              Es una forma de expresión, un camino hacia la independencia creativa y económica, 
              y una puerta hacia la confianza personal.
            </p>
            <p>
              Cada puntada que aprendes es un paso hacia la autonomía. Cada proyecto completado 
              es una victoria que construye tu autoestima. Y cada prenda que creas cuenta tu historia única.
            </p>
            <div className="mission-stats">
              <div className="stat-item">
                <span className="stat-number">500+</span>
                <span className="stat-label">Alumnas Graduadas</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">15</span>
                <span className="stat-label">Años de Experiencia</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">98%</span>
                <span className="stat-label">Satisfacción</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Acceso a Contenido</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="experience-section home-reveal">
        <h2 className="section-title">La experiencia de aprender costura</h2>
        <p className="section-subtitle">
          Más que técnicas, descubrirás una nueva forma de ver el mundo textil
        </p>
        <div className="experience-grid">
          {experiences.map((exp, index) => (
            <div key={index} className="experience-card">
              <div className="experience-icon">{exp.icon}</div>
              <h3>{exp.title}</h3>
              <p>{exp.description}</p>
            </div>
          ))}
        </div>
      </section>

      


      {/* Últimos cursos (reales, hasta 3) */}
      <section className="courses-grid-section home-reveal">
        <div className="section-container">
          <h2 className="section-title">Cursos Diseñados para Ti</h2>
          <p className="section-subtitle">
            Los últimos cursos que sumamos para vos
          </p>
          {loading ? (
            <div className="courses-grid courses-grid--centered">
              <p className="courses-grid-loading">Cargando cursos…</p>
            </div>
          ) : latestCourses.length === 0 ? (
            <div className="courses-grid courses-grid--centered">
              <p className="courses-grid-loading">Próximamente más cursos.</p>
            </div>
          ) : (
            <div className={`courses-grid ${latestCourses.length < 3 ? 'courses-grid--centered' : ''}`}>
              {latestCourses.map((course) => (
                <div key={course.id} className="course-card" data-index={course.id}>
                  <div className="course-badge">{difficultyLabel(course.difficulty)}</div>
                  <h3 className="course-title">{course.title}</h3>
                  <p className="course-description">{course.short_description || course.title}</p>
                  <div className="course-meta">
                    <span className="course-duration"><FiClock /> {formatDuration(course.duration_hours)}</span>
                  </div>
                  <Link to={`/cursos/${course.slug}`}>
                    <button type="button" className="course-btn">
                      Ver más <FiArrowRight />
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Cómo Funciona */}
      <section className="how-it-works-section home-reveal">
        <div className="section-container">
          <h2 className="section-title">Tu camino hacia la maestría</h2>
          <p className="section-subtitle">
            Un proceso probado paso a paso
          </p>
          <div className="steps-container">
            {steps.map((step, index) => (
              <div key={index} className="step-item">
                <div className="step-number">{step.number}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
{/* Nueva Sección - Urbanist con Scroll Horizontal */}
      <section className="urbanist-section">
        <div className="urbanist-wrapper">
          <svg className="urbanist-bg-gradient" width="100%" viewBox="0 0 1920 1300" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <rect width="1920" height="1300" fill="url(#urbanist-gradient)"></rect>
            <defs>
              <linearGradient id="urbanist-gradient" x1="1300.54" y1="201.621" x2="959.727" y2="841.863" gradientUnits="userSpaceOnUse">
                <stop offset="0.15" stopColor="var(--urbanist-sub-bg)" stopOpacity="1"></stop>
                <stop offset="0.85" stopColor="var(--urbanist-main-bg)"></stop>
              </linearGradient>
            </defs>
          </svg>
          
          <div id="urbanist-content" className="urbanist-content">
            <h1 style={{ fontSize: 'clamp(4vw, 100px, 7vw)' }}>Peluches tejidos con amor</h1>

            <p>
              Cada uno de estos peluches está tejido a mano, punto por punto, con dedicación, paciencia y mucho
              cariño. 
            </p>

            <p className="urbanist-text-2">
              En nuestros cursos online vas a aprender a crear personajes como la vaca turquesa, el ratón tejido,
              el ratón navideño, el pollito y muchos más. Desde las bases del tejido hasta los detalles que hacen
              que cada muñeco cobre vida.
            </p>


          </div>
          
          <div id="urbanist-panes-container" className="urbanist-panes-container">
            <div className="urbanist-pane">
              <img src="/img/ratonturquesa.png" alt="Peluche ratón navideño tejido a mano" />
            </div>



            <div className="urbanist-pane">
              <img src="/img/ratonnavidenoverde.png" alt="Peluche ratón navideño tejido a mano" />
            </div>

            <div className="urbanist-pane">
              <img src="/img/pollitosolo.png" alt="Peluche pollito tejido a mano" />
            </div>
            <div className="urbanist-pane">
              <img src="/img/vacatuquesa.png" alt="Peluche vaca turquesa tejido a mano" />
            </div>
          </div>
        </div>
      </section>
      {/* Beneficios */}
      <section className="benefits-section home-reveal">
        <div className="section-container">
          <h2 className="section-title">Por qué elegirnos</h2>
          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <div key={index} className="benefit-item">
                <div className="benefit-icon">{benefit.icon}</div>
                <h3 className="benefit-title">{benefit.title}</h3>
                <p className="benefit-desc">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="testimonials-section home-reveal">
        <div className="section-container">
          <h2 className="section-title">Historias que inspiran</h2>
          <p className="section-subtitle">
            Las voces de quienes han transformado su vida
          </p>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="quote-mark">"</div>
                <p className="testimonial-text">{testimonial.text}</p>
                <div className="testimonial-author-wrapper">
                  <p className="testimonial-author">— {testimonial.author}</p>
                  <p className="testimonial-role">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="cta-final-section home-reveal">
        <div className="cta-final-content">
          <h2 className="cta-final-title">¿Lista para comenzar tu transformación?</h2>
          <p className="cta-final-text">
            Únete a cientos de mujeres que han descubierto el placer de crear con sus propias manos
          </p>
          <Link to="/register">
            <Button size="large" className="btn-cta-final">
              Quiero inscribirme
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;