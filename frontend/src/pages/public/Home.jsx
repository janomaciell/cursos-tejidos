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
  FiTrendingUp,
  FiShield,
  FiVideo,
  FiDownload,
  FiMessageCircle,
  FiPlay,
  FiCheckCircle
} from 'react-icons/fi';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import NgrokImage from '../../components/common/NgrokImage';
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
      // En mobile y tablet, no aplicar el scroll horizontal animado
      // Solo se aplica el layout estático via CSS
      if (window.innerWidth <= 1024) return;

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

  // Animaciones GSAP mejoradas
  useEffect(() => {
    const triggers = [];

    // Hero content animation
    const heroTl = gsap.timeline({ delay: 0.3 });
    heroTl
      .fromTo('.hero-subtitle', 
        { opacity: 0, y: -20 }, 
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      )
      .fromTo('.hero-title', 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 
        '-=0.3'
      )
      .fromTo('.hero-description', 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 
        '-=0.4'
      )
      .fromTo('.hero-buttons > *', 
        { opacity: 0, y: 20, scale: 0.95 }, 
        { opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 0.5, ease: 'back.out(1.2)' }, 
        '-=0.3'
      );

    // Trust banner animation
    gsap.fromTo('.trust-banner',
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.trust-banner',
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      }
    );

    // Stats grid animation with counter effect
    const statsItems = gsap.utils.toArray('.stat-item');
    statsItems.forEach(item => {
      gsap.fromTo(item,
        { opacity: 0, y: 40, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: 'back.out(1.3)',
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          onStart: () => {
            const numberEl = item.querySelector('.stat-number');
            if (numberEl && numberEl.textContent.includes('+')) {
              const targetNumber = parseInt(numberEl.textContent.replace('+', ''));
              gsap.from({ val: 0 }, {
                val: targetNumber,
                duration: 1.5,
                ease: 'power1.out',
                onUpdate: function() {
                  numberEl.textContent = Math.round(this.targets()[0].val) + '+';
                }
              });
            }
          }
        }
      );
    });

    // Mission section with parallax effect
    const missionTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.mission-section',
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });
    missionTl
      .fromTo('.mission-content h2', 
        { opacity: 0, y: 50 }, 
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      )
      .fromTo('.mission-content p', 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, stagger: 0.15, duration: 0.6, ease: 'power2.out' }, 
        '-=0.4'
      );
    if (missionTl.scrollTrigger) triggers.push(missionTl.scrollTrigger);

    // Video section reveal
    const videoTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.video-intro-section',
        start: 'top 75%',
        toggleActions: 'play none none none',
      },
    });
    videoTl
      .fromTo('.video-content', 
        { opacity: 0, x: -50 }, 
        { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' }
      )
      .fromTo('.video-player-wrapper', 
        { opacity: 0, x: 50, scale: 0.95 }, 
        { opacity: 1, x: 0, scale: 1, duration: 0.8, ease: 'power2.out' }, 
        '-=0.5'
      );
    if (videoTl.scrollTrigger) triggers.push(videoTl.scrollTrigger);

    // Credentials with stagger
    gsap.fromTo('.credential-item',
      { opacity: 0, y: 30, rotateY: -15 },
      {
        opacity: 1,
        y: 0,
        rotateY: 0,
        stagger: 0.12,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.credentials-section',
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      }
    );

    // Experience cards with 3D effect
    gsap.fromTo('.experience-card',
      { opacity: 0, y: 50, rotateX: -10 },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        stagger: 0.15,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.experience-section',
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      }
    );

    // Course cards with flip animation
    const courseCards = gsap.utils.toArray('.course-card');
    courseCards.forEach((card, index) => {
      gsap.fromTo(card,
        { opacity: 0, rotateY: -20, y: 50 },
        {
          opacity: 1,
          rotateY: 0,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          delay: index * 0.15,
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // Steps with connection line animation
    const stepsTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.how-it-works-section',
        start: 'top 75%',
        toggleActions: 'play none none none',
      },
    });
    stepsTl
      .fromTo('.steps-container::before', 
        { scaleX: 0 }, 
        { scaleX: 1, duration: 1.2, ease: 'power2.inOut' }
      )
      .fromTo('.step-item', 
        { opacity: 0, scale: 0.8, y: 30 }, 
        { opacity: 1, scale: 1, y: 0, stagger: 0.15, duration: 0.6, ease: 'back.out(1.3)' }, 
        '-=0.8'
      );
    if (stepsTl.scrollTrigger) triggers.push(stepsTl.scrollTrigger);

    // Benefits with bounce
    gsap.fromTo('.benefit-item',
      { opacity: 0, y: 40, scale: 0.85 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        stagger: 0.1,
        duration: 0.6,
        ease: 'elastic.out(1, 0.75)',
        scrollTrigger: {
          trigger: '.benefits-section',
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      }
    );

    // Testimonials with slide effect
    gsap.fromTo('.testimonial-card',
      { opacity: 0, x: -60 },
      {
        opacity: 1,
        x: 0,
        stagger: 0.2,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.testimonials-section',
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      }
    );

    // Guarantee section pulse
    gsap.fromTo('.guarantee-content',
      { opacity: 0, scale: 0.92 },
      {
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.guarantee-section',
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      }
    );

    // CTA final with dramatic entrance
    const ctaTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.cta-final-section',
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });
    ctaTl
      .fromTo('.cta-final-content', 
        { opacity: 0, scale: 0.9, y: 40 }, 
        { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: 'power3.out' }
      )
      .fromTo('.btn-cta-final', 
        { scale: 0.95 }, 
        { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' }, 
        '-=0.3'
      );
    if (ctaTl.scrollTrigger) triggers.push(ctaTl.scrollTrigger);

    return () => triggers.forEach((t) => t && t.kill());
  }, [loading]);

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

  // Thread Animation Logic - Mantener igual
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
    { number: '01', title: 'Inscribite', desc: 'Elegí el proyecto que quieras empezar hoy.', icon: <FiBook /> },
    { number: '02', title: 'Accedé', desc: 'Disfrutá de todo el contenido y videos las 24/7.', icon: <FiVideo /> },
    { number: '03', title: 'Tejé', desc: 'Creá tus amigurumis con videos claros y guiados.', icon: <FiEdit2 /> },
    { number: '04', title: 'Consultá', desc: 'Recibí soporte personalizado si tenés dudas.', icon: <FiHeadphones /> },
    { number: '05', title: 'Emprendé', desc: 'Lucí, regalá o vendé tus creaciones con orgullo.', icon: <FiTrendingUp /> }
  ];

  const benefits = [
    { icon: <FiMessageCircle />, title: 'Soporte directo por WhatsApp', desc: 'No estás sola: te acompaño personalmente por WhatsApp para que resuelvas cualquier duda mientras tejés.' },
    { icon: <FiClock />, title: 'Aprendizaje a tu propio ritmo', desc: 'Accedé a todas las clases cuando quieras, las veces que necesites, sin horarios fijos ni presiones.' },
    { icon: <FiClock />, title: 'Acceso de por vida', desc: 'Tu acceso nunca vence: podés volver a las lecciones cada vez que quieras repasar o practicar.' },
    { icon: <FiUsers />, title: 'Comunidad exclusiva de tejedoras', desc: 'Compartí avances, logros y dudas con otras alumnas que aman el crochet tanto como vos.' },
    { icon: <FiAward />, title: 'Técnica Profesional', desc: 'Dominá el arte del crochet con métodos probados que garantizan resultados impecables, incluso si recién empezás.' }
  ];

  const testimonials = [
    {
      text: 'Me anoté para aprender a tejer desde cero con el curso del Búho verde. Andy explica excelente. Lo recomiendo muchísimo para empezar.',
      author: 'María González',
      role: 'Emprendedora textil',  
      rating: 5,
      image: '/img/testimonial-1.jpg'
    },
    {
      text: 'Ya tenía una base de tejido, pero nunca me había animado a hacer un proyecto completo. Con el curso del Honguito, por primera vez logré terminar un amigurumi sin frustrarme. Las clases son súper claras.',
      author: 'Laura Martínez',
      role: 'Diseñadora independiente',
      rating: 5,
      image: '/img/testimonial-2.jpg'
    },
    {
      text: 'Me sirvió mucho porque si te trabás en un punto, Andy te contesta por WhatsApp y lo sacás adelante. El video se ve con mucha claridad y por fin logré que las costuras me queden prolijas y no se note el relleno.',
      author: 'Sofía Rodríguez',
      role: 'Modista profesional',
      rating: 5,
      image: '/img/testimonial-3.jpg'
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
      description: 'Aprendé a materializar tus ideas con hilos y puntos. Cada proyecto es una oportunidad para expresar tu estilo único a través del tejido.'
    },
    {
      icon: <FiZap />,
      title: 'Independencia',
      description: 'Imaginá poder crear tus propios amigurumis, decorar tu hogar o incluso iniciar tu propio emprendimiento con tus creaciones.'
    },
    {
      icon: <FiHeart />,
      title: 'Terapia y Mindfulness',
      description: 'Tejer es meditativo. El ritmo de los puntos y ver el progreso constante tiene un efecto calmante incomparable para tu mente.'
    },
    {
      icon: <FiUsers />,
      title: 'Conexión Humana',
      description: 'Unite a nuestra comunidad vibrante donde compartimos proyectos, resolvemos dudas y celebramos cada logro juntas en el mundo del crochet.'
    },
    {
      icon: <FiTrendingUp />,
      title: 'Crecimiento Constante',
      description: 'Cada proyecto es un desafío que te empuja a mejorar. Verás tu progreso semana a semana en cada vuelta de tu tejido.'
    }
  ];

  const credentials = [
    { icon: <FiAward />, title: '30 años', subtitle: 'de experiencia' },
    { icon: <FiVideo />, title: '100% Online', subtitle: 'a tu ritmo' },
    { icon: <FiHeadphones />, title: 'Soporte', subtitle: 'personalizado' },
    { icon: <FiCheckCircle />, title: 'Acceso', subtitle: 'de por vida' }
  ];

  return (
    <div className="home-page">
      {/* Hero Section with Thread Animation */}
      <section className="hero-section">
        <canvas ref={canvasRef} id="threadCanvas"></canvas>
        <div className="hero-content">
          <p className="hero-subtitle">El Arte de Crear con tus Manos</p>
          <h1 className="hero-title">
            Transformá hilos en momentos mágicos <br /> con Crochet
          </h1>
          <p className="hero-description">
            Aprendé a tejer amigurumis únicos con lecciones claras y
            paso a paso. Desde el primer punto hasta crear tus propios personajes,
            sin necesidad de experiencia previa.
          </p>
          <div className="hero-buttons">
            <Link to="/cursos">
              <Button size="large" className="btn-primary">
                Ver Cursos Disponibles
                <FiArrowRight />
              </Button>
            </Link>
            <Link to="/como-funciona" className="btn-play-video">
              <FiPlay />
              <span>Ver cómo funciona</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="trust-banner">
        <div className="trust-items">
          <div className="trust-item">
            <FiMessageCircle />
            <span>Soporte directo por WhatsApp</span>
          </div>
          <div className="trust-item">
            <FiClock />
            <span>Aprendizaje a tu propio ritmo</span>
          </div>

          <div className="trust-item">
            <FiCheckCircle />
            <span>Acceso de por vida</span>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section home-reveal">
        <div className="mission-container">
          <div className="mission-content">
            <h2>No solo enseñamos a tejer,<br /><span className="highlight">transformamos hilos en sueños</span></h2>
            <p>
              En Tejiendo con Andy, creemos que el crochet es mucho
              más que una habilidad técnica. Es una forma de expresión, un camino hacia la
              independencia creativa y económica, y una puerta hacia la confianza personal.
            </p>
            <p>
              Cada punto que aprendes es un paso hacia la autonomía. Cada proyecto
              completado es una victoria que construye tu autoestima. Y cada amigurumi que
              creas cuenta tu historia única.
            </p>
            <div className="mission-stats">
              <div className="stat-item">
                <span className="stat-number">100%</span>
                <span className="stat-label">Online y a tu ritmo</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">30</span>
                <span className="stat-label">Años de Experiencia</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">♡</span>
                <span className="stat-label">Soporte Personalizado</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">∞</span>
                <span className="stat-label">Acceso de por vida</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Introduction Section - NUEVA */}
      <section className="video-intro-section">
        <div className="video-intro-container">
          <div className="video-content">
            <h2>Conocé a tu instructora</h2>
            <p className="video-intro-text">
              Soy Andrea, tengo 54 años y tejo desde que era chica. El tejido siempre fue parte de mi vida: primero como un aprendizaje familiar, luego como una pasión, y hoy como una forma de compartir, conectar y acompañar a otras personas.
            </p>
            <p className="video-intro-text">
              Actualmente estoy creando cursos simples, claros y accesibles para todos. Creo profundamente que cualquiera puede aprender a tejer, sin importar la edad o la experiencia previa.
            </p>
            <p className="video-intro-text">
              Para mí, tejer es un momento de calma, una pausa en el día. Mi deseo es que, a través de estos cursos, puedas aprender, crear y también regalarte ese momento tan especial para vos.
            </p>
            <div className="video-highlights">
              <div className="highlight-point">
                <FiCheckCircle />
                <span>30 años de experiencia enseñando</span>
              </div>
              <div className="highlight-point">
                <FiCheckCircle />
                <span>Clases claras y fáciles de seguir</span>
              </div>
              <div className="highlight-point">
                <FiCheckCircle />
                <span>Soporte personalizado incluido</span>
              </div>
            </div>
          </div>
          <div className="video-player-wrapper">
            <div className="video-placeholder">
              <img src="/img/andy-instructor.png" alt="Andy - Instructora de costura" />
            </div>
          </div>
        </div>
      </section>

      {/* Credentials Section - NUEVA */}
      <section className="credentials-section">
        <div className="credentials-container">
          {credentials.map((cred, index) => (
            <div key={index} className="credential-item">
              <div className="credential-icon">{cred.icon}</div>
              <div className="credential-text">
                <h3>{cred.title}</h3>
                <p>{cred.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Experience Section */}
      <section className="experience-section home-reveal">
        <div className="section-container">
          <h2 className="section-title-experience-public">La experiencia de aprender crochet</h2>
          <p className="section-subtitle">
            Más que técnicas, descubrirás una nueva forma de ver el mundo del crochet
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
        </div>
      </section>

      {/* Últimos cursos */}
      <section className="courses-grid-section home-reveal">
        <div className="section-container">
          <h2 className="section-title-cursos">Cursos Diseñados para Tu Creatividad</h2>
          <p className="section-subtitle">
            Programas completos con todo lo que necesitas para dominar el arte del crochet y los amigurumis
          </p>
          {loading ? (
            <div className="courses-grid courses-grid--centered">
              <p className="courses-grid-loading">Cargando cursos…</p>
            </div>
          ) : latestCourses.length === 0 ? (
            <div className="courses-grid courses-grid--centered">
              <p className="courses-grid-loading">Próximamente más proyectos para seguir creando.</p>
            </div>
          ) : (
            <div className={`courses-grid ${latestCourses.length < 3 ? 'courses-grid--centered' : ''}`}>
              {latestCourses.map((course) => (
                <div key={course.id} className="course-card" data-index={course.id}>
                  <div className="course-image-wrapper">
                    <NgrokImage 
                      src={course.cover_image}
                      alt={course.title}
                    />
                    <div className="course-badge">{difficultyLabel(course.difficulty)}</div>
                  </div>
                  <div className="course-content">
                    <h3 className="course-title">{course.title}</h3>
                    <p className="course-description">{course.short_description || course.title}</p>
                    <div className="course-meta">
                      <span className="course-duration">
                        <FiClock /> {formatDuration(course.duration_hours)}
                      </span>
                      <span className="course-students">
                        <FiUsers /> 50+ alumnas
                      </span>
                    </div>
                    <Link to={`/cursos/${course.slug}`}>
                      <button type="button" className="course-btn">
                        Ver detalles <FiArrowRight />
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="view-all-courses">
            <Link to="/cursos">
              <Button size="large" className="btn-secondary">
                Ver Todos los Proyectos
                <FiArrowRight />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Cómo Funciona */}
      <section className="how-it-works-section-public home-reveal">
        <div className="section-container">
          <h2 className="section-title-how-it-works-public">Tu camino hacia la maestría</h2>
          <p className="section-subtitle">
            Un proceso simple y comprobado, paso a paso
          </p>
          <div className="steps-container-how-it-works-public">
            {steps.map((step, index) => (
              <div key={index} className="step-item-how-it-works-public">
                <div className="step-icon-wrapper-how-it-works-public">
                  <div className="step-icon-how-it-works-public">{step.icon}</div>
                  <div className="step-number-how-it-works-public">{step.number}</div>
                </div>
                <h3 className="step-title-how-it-works-public">{step.title}</h3>
                <p className="step-desc-how-it-works-public">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Urbanist Section - Mantener igual */}
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
            <h1 style={{ fontSize: 'clamp(4vw, 100px, 7vw)' }}>Amigurumis con alma y diseño</h1>

            <p>
              Cada uno de nuestros proyectos está diseñado para ser tejido a mano, punto por punto, con la dedicación y el cariño que solo lo artesanal puede brindar.
            </p>

            <p className="urbanist-text-2">
              En nuestros cursos online vas a descubrir cómo dar vida a una gran variedad de personajes y diseños exclusivos. Te guiamos desde las bases fundamentales del crochet hasta los detalles más avanzados que hacen que cada muñeco tenga una personalidad única.
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
          <h2 className="section-title-benefits-public">Por qué elegirnos</h2>
          <p className="section-subtitle-benefits-public">
            Todo lo que necesitas para aprender está incluido
          </p>
          <div className="benefits-grid-section-public">
            {benefits.map((benefit, index) => (
              <div key={index} className="benefit-item-public">
                <div className="benefit-icon-public">{benefit.icon}</div>
                <h3 className="benefit-title-public">{benefit.title}</h3>
                <p className="benefit-desc-public">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="testimonials-section home-reveal">
        <div className="section-container">
          <h2 className="section-title-testimonials-public">Historias que inspiran</h2>
          <p className="section-subtitle-testimonials-public">
            Lo que dicen quienes ya se animaron a tejer conmigo.
          </p>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-header">
                {/*<img src={testimonial.image} alt={testimonial.author} className="testimonial-image" />*/}
                
                  <div className="testimonial-rating">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FiStar key={i} className="star-filled" />
                    ))}
                  </div>
                </div>
                <p className="testimonial-text">{testimonial.text}</p>
                <div className="testimonial-author-wrapper">
                  <p className="testimonial-author">{testimonial.author}</p>
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
            Únete a cientos de mujeres que han descubierto el placer de crear con sus propias manos.<br />
            <strong>Inscribite hoy y obtené acceso inmediato a todos los cursos.</strong>
          </p>
          <Link to="/register">
            <Button size="large" className="btn-cta-final">
              Comenzar Ahora
              <FiArrowRight />
            </Button>
          </Link>
          <p className="cta-disclaimer">
            <FiMessageCircle /> Soporte directo por WhatsApp · Acceso de por vida
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;