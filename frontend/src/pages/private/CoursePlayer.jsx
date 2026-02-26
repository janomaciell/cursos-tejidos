import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coursesAPI } from '../../api/courses';
import VideoPlayer from '../../courses/VideoPlayer';
import Loader from '../../components/common/Loader';
import {
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiLock,
  FiPlay,
  FiAward,
  FiDownload,
  FiFolder,
  FiLayers,
  FiInfo,
  FiMenu,
} from 'react-icons/fi';
import gsap from 'gsap';
import './CoursePlayer.css';

/* ─── Helpers ──────────────────────────────────────────────────────── */
const getResourceIcon = (type) => {
  switch (type) {
    case 'pdf':   return { icon: '📄', cls: 'pdf',    label: 'PDF' };
    case 'excel': return { icon: '📊', cls: 'excel',  label: 'Excel' };
    case 'word':  return { icon: '📝', cls: 'word',   label: 'Word' };
    case 'ppt':   return { icon: '📑', cls: 'ppt',    label: 'PowerPoint' };
    case 'folder':return { icon: '📁', cls: 'folder', label: 'Carpeta' };
    case 'txt':   return { icon: '📋', cls: 'txt',    label: 'Texto' };
    case 'zip':   return { icon: '🗜️', cls: 'zip',    label: 'ZIP' };
    case 'img':   return { icon: '🖼️', cls: 'img',    label: 'Imagen' };
    case 'video': return { icon: '🎬', cls: 'video',  label: 'Video' };
    default:      return { icon: '📎', cls: 'txt',    label: 'Archivo' };
  }
};

/* Tabs — mismos íconos que el HTML */
const TABS = [
  { id: 'overview',  label: 'Descripción',  icon: FiInfo },
  { id: 'resources', label: 'Recursos',     icon: FiFolder },
];

/* ─── Componente ───────────────────────────────────────────────────── */
const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate     = useNavigate();

  const [course, setCourse]                 = useState(null);
  const [modules, setModules]               = useState([]);
  const [currentLesson, setCurrentLesson]   = useState(null);
  const [progress, setProgress]             = useState({});
  const [loading, setLoading]               = useState(true);
  // On mobile the sidebar should be closed by default to avoid showing
  // the overlay/transparent effect on load. Use the hamburger to open it.
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalLessons, setTotalLessons]     = useState(0);
  const [activeTab, setActiveTab]           = useState('overview');
  const [resources, setResources]           = useState([]);
  const [expandedModules, setExpandedModules] = useState({});

  const videoRef         = useRef(null);
  const currentLessonRef = useRef(currentLesson);
  useEffect(() => { currentLessonRef.current = currentLesson; }, [currentLesson]);

  useEffect(() => { loadCourseData(); }, [courseId]);

  useEffect(() => {
    if (!loading) {
      gsap.fromTo('.cp-header', { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
      gsap.fromTo('.cp-video-block', { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 0.1, ease: 'power2.out' });
      gsap.fromTo('.cp-below-video', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.22, ease: 'power2.out' });
    }
  }, [loading]);

  useEffect(() => {
    let completed = 0, total = 0;
    modules.forEach(m => m.lessons?.forEach(l => {
      total++;
      if (progress[l.id]?.completed) completed++;
    }));
    setCompletedCount(completed);
    setTotalLessons(total);
  }, [modules, progress]);

  useEffect(() => {
    if (!currentLesson) return;
    loadResources(currentLesson.id);
  }, [currentLesson?.id]);

  /* Expandir módulo activo automáticamente */
  useEffect(() => {
    if (!currentLesson || modules.length === 0) return;
    for (const m of modules) {
      if (m.lessons?.some(l => l.id === currentLesson.id)) {
        setExpandedModules(prev => ({ ...prev, [m.id]: true }));
        break;
      }
    }
  }, [currentLesson, modules]);

  /* ── API ── */
  const loadCourseData = async () => {
    try {
      setLoading(true);
      const [courseData, modulesData, progressData] = await Promise.all([
        coursesAPI.getCourseBySlug(courseId),
        coursesAPI.getCourseModules(courseId),
        coursesAPI.getLessonProgress(courseId),
      ]);
      setCourse(courseData);
      const modulesList = Array.isArray(modulesData) ? modulesData : [];
      setModules(modulesList);
      const progressList = Array.isArray(progressData) ? progressData : (progressData?.results ?? []);
      const progressMap  = {};
      progressList.forEach(p => { progressMap[p.lesson] = p; });
      setProgress(progressMap);
      const firstIncomplete = findFirstIncomplete(modulesList, progressMap);
      setCurrentLesson(firstIncomplete || modulesList[0]?.lessons?.[0] || null);
    } catch (error) {
      console.error('Error al cargar curso:', error);
      navigate('/mis-cursos');
    } finally {
      setLoading(false);
    }
  };

  const loadResources = async (lessonId) => {
    try {
      const data = await coursesAPI.getLessonDocuments(lessonId);
      // data puede ser array directo o { results: [...] }
      const list = Array.isArray(data) ? data : (data?.results ?? []);
      setResources(list);
    } catch (e) {
      console.warn('No se pudieron cargar los recursos:', e);
      setResources([]);
    }
  };

  /* ── Helpers ── */
  const findFirstIncomplete = (mods, progressMap) => {
    for (const m of mods)
      for (const l of m.lessons || [])
        if (!progressMap[l.id]?.completed) return l;
    return null;
  };

  const getModuleForLesson = (lessonId) => {
    for (const m of modules)
      for (const l of m.lessons || [])
        if (l.id === lessonId) return m;
    return null;
  };

  const getLessonMeta = (lesson, module) => {
    const idx   = module?.lessons?.findIndex(l => l.id === lesson.id) ?? 0;
    const total = module?.lessons?.length ?? 0;
    return { lessonIdx: idx + 1, totalInModule: total };
  };

  /* ── Handlers ── */
  const handleLessonSelect = (lesson) => {
    setCurrentLesson(lesson);
    setActiveTab('overview');
    if (videoRef.current)
      gsap.fromTo(videoRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleProgress = useCallback(async (pct) => {
    const lesson = currentLessonRef.current;
    if (!lesson) return;
    const isCompleted = pct >= 90;
    setProgress(prev => ({
      ...prev,
      [lesson.id]: { ...prev[lesson.id], progress_percentage: pct, completed: isCompleted },
    }));
    try {
      await coursesAPI.updateLessonProgress({ lesson: lesson.id, progress_percentage: pct, completed: isCompleted });
    } catch (e) { console.error(e); }
  }, []);

  const goToNextLesson = async () => {
    if (!currentLesson) return;
    await handleProgress(100);
    let found = false;
    for (const m of modules)
      for (const l of m.lessons || []) {
        if (found) { handleLessonSelect(l); return; }
        if (l.id === currentLesson.id) found = true;
      }
  };

  const toggleModule = (moduleId) =>
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));

  const getOverallProgress = () =>
    totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

  const isLastLesson = () => {
    const all = modules.flatMap(m => m.lessons || []);
    return all[all.length - 1]?.id === currentLesson?.id;
  };

  /* ── Guards ── */
  if (loading) return <Loader fullScreen />;
  if (!course || !currentLesson) return (
    <div className="player-error">
      <div className="error-icon">📚</div>
      <h2>No se pudo cargar el contenido</h2>
      <p>No pudimos obtener la información del curso.</p>
      <button onClick={() => navigate('/mis-cursos')} className="error-btn">Volver a mis cursos</button>
    </div>
  );

  const overallPct    = getOverallProgress();
  const currentModule = getModuleForLesson(currentLesson.id);
  const { lessonIdx, totalInModule } = getLessonMeta(currentLesson, currentModule);
  const activeModuleIdx = modules.findIndex(m => m.lessons?.some(l => l.id === currentLesson.id));

  /* ══════════════════════════ RENDER ═══════════════════════════════ */
  return (
    <div className="course-player-page">

      {/* ══════ HEADER ══════
          Blanco, border-b, flex-row, progress bar central + trophy icon
          Réplica 1:1 del <header> del HTML de referencia               */}
      <header className="cp-header">

        {/* Left: back + divider + course title */}
        <div className="cp-header-left">
          <button className="cp-back-btn" onClick={() => navigate('/mis-cursos')}>
            <FiChevronLeft />
          </button>
          <div className="cp-divider" />
          <div className="cp-course-info">
            <h2 className="cp-course-title">{course.title}</h2>
            {currentModule && (
              <p className="cp-course-chapter">{currentModule.title}</p>
            )}
          </div>
        </div>

        {/* Center: pct label + progress track + trophy */}
        <div className="cp-header-center">
          <span className="cp-pct-label">{overallPct}% Completado</span>
          <div className="cp-track">
            <div className="cp-track-fill" style={{ width: `${overallPct}%` }} />
          </div>
          <FiAward className="cp-trophy-icon" />
        </div>

        {/* Right: dashboard btn + divider + avatar */}
        <div className="cp-header-right">
          {/* Mobile: open sidebar button (hidden on desktop) */}
          <button
            className="cp-open-sb-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir contenido del curso"
            title="Contenido del curso"
          >
            <FiMenu />
          </button>

          <button className="cp-dashboard-btn" onClick={() => navigate('/mis-cursos')}>
            <FiLayers />
            <span>Panel</span>
          </button>

        </div>
      </header>

      {/* ══════ BODY — main (75%) + aside (25% fixed) ══════ */}
      <div className="cp-body">

        {/* ── Main scrollable ── */}
        <main className="cp-main">

          {/* Video — bg-black, aspect-video, controls fade on hover */}
          <div className="cp-video-block group" ref={videoRef}>
            <VideoPlayer
              key={currentLesson.id}
              lessonId={currentLesson.id}
              onProgress={handleProgress}
            />




          </div>

          {/* Contenido debajo del video */}
          <div className="cp-below-video">

            {/* Título + Next Lesson */}
            <div className="cp-title-row">
              <div className="cp-title-block">
                <h1 className="cp-lesson-h1">
                  {currentModule
                    ? `${activeModuleIdx + 1}.${lessonIdx} ${currentLesson.title}`
                    : currentLesson.title}
                </h1>
                <p className="cp-lesson-sub">
                  {currentModule ? currentModule.title : 'Sección'} • Lección {lessonIdx} de {totalInModule}
                </p>
              </div>
              <button
                className="cp-next-lesson-btn"
                onClick={goToNextLesson}
                disabled={isLastLesson()}
              >
                <span>Siguiente Lección</span>
                <FiChevronRight />
              </button>
            </div>

            {/* Tabs — border-b, réplica exacta del HTML */}
            <div className="cp-tabs-border">
              <nav className="cp-tabs-nav">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    className={`cp-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <tab.icon />
                    {tab.label}
                    {tab.id === 'resources' && resources.length > 0 && (
                      <span className="cp-tab-count">{resources.length}</span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* ─ Tab Overview ─ */}
            {activeTab === 'overview' && (
              <div className="cp-prose">
                <h3 className="cp-prose-h3">Sobre esta lección</h3>
                <p className="cp-prose-p">
                  {currentLesson.description ||
                    "En esta lección exploramos los conceptos fundamentales del contenido del curso. Seguí el material y avanzá a tu propio ritmo."}
                </p>

                {/* Grid 2 columnas — réplica exacta del HTML */}
                <div className="cp-ov-grid">

                  {/* What you'll learn */}
                  <div className="cp-ov-card">
                    <div className="cp-ov-card-hd">
                      <div className="cp-ov-icon blue">💡</div>
                      <h4>Qué vas a aprender</h4>
                    </div>
                    <ul className="cp-ov-list">
                      {(currentLesson.learning_points?.length > 0
                        ? currentLesson.learning_points
                        : ['Conceptos fundamentales de la lección', 'Aplicación práctica paso a paso', 'Recursos y materiales de apoyo']
                      ).map((p, i) => (
                        <li key={i}>
                          <span className="cp-ov-check">✓</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Prerequisites */}
                  <div className="cp-ov-card">
                    <div className="cp-ov-card-hd">
                      <div className="cp-ov-icon purple">🎓</div>
                      <h4>Requisitos previos</h4>
                    </div>
                    <ul className="cp-ov-list prereq">
                      {(currentLesson.prerequisites?.length > 0
                        ? currentLesson.prerequisites
                        : ['Haber visto las lecciones anteriores', 'Materiales del módulo actual completados']
                      ).map((p, i) => (
                        <li key={i}>
                          <span className="cp-ov-arrow">›</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="cp-resources">
                {resources.length === 0
                  ? <div className="cp-empty"><FiFolder style={{ width: 32, height: 32, opacity: 0.3 }} /><p>No hay recursos para esta lección.</p></div>
                  : resources.map(res => {
                      const { icon, cls, label } = getResourceIcon(res.file_type || res.type);
                      const downloadUrl = res.file_url || res.url || '#';
                      const sizeLabel   = res.size_display || res.size || '';
                      return (
                        <div key={res.id} className="cp-res-row">
                          <div className={`cp-res-icon ${cls}`}>{icon}</div>
                          <div className="cp-res-info">
                            <span className="cp-res-name">{res.name}</span>
                            <span className="cp-res-size">{sizeLabel}{sizeLabel && label ? ' • ' : ''}{label}</span>
                          </div>
                          <a
                            href={downloadUrl}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="cp-res-dl"
                            onClick={e => downloadUrl === '#' && e.preventDefault()}
                          >
                            <FiDownload />
                          </a>
                        </div>
                      );
                    })
                }
              </div>
            )}

          </div>
        </main>

        {/* ══════ SIDEBAR — fixed 25% right, bg-slate-50
            Réplica exacta del <aside> del HTML de referencia         */}
  <aside className={`cp-sidebar ${sidebarOpen ? 'open' : ''}`}>

          {/* Sidebar header */}
          <div className="cp-sb-hd">
            <h3 className="cp-sb-title">Contenido del curso</h3>
            <p className="cp-sb-meta">{modules.length} Módulos • {totalLessons} Lecciones</p>
          </div>

          {/* Módulos (scrollable) */}
          <div className="cp-sb-scroll">
            {modules.map((module, idx) => {
              const isActiveModule = module.lessons?.some(l => l.id === currentLesson.id);
              const isExpanded     = expandedModules[module.id] ?? isActiveModule;
              const isModLocked    = idx > activeModuleIdx && !module.lessons?.some(l => progress[l.id]?.completed);

              return (
                <div key={module.id} className="cp-module">

                  {/* Module button — réplica exacta del HTML */}
                  <button
                    className={`cp-mod-btn ${isActiveModule ? 'active' : ''}`}
                    onClick={() => !isModLocked && toggleModule(module.id)}
                  >
                    <div className="cp-mod-info">
                      <span className="cp-mod-label">Módulo {idx + 1}</span>
                      <span className="cp-mod-name">{module.title}</span>
                    </div>
                    {/* expand_more / expand_less / lock */}
                    {isModLocked
                      ? <span className="cp-mod-chevron">🔒</span>
                      : <span className={`cp-mod-chevron ${isExpanded ? 'open' : ''}`}>▾</span>
                    }
                  </button>

                  {/* Lessons list (expanded) */}
                  {isExpanded && !isModLocked && (
                    <div className="cp-lessons">
                      {module.lessons?.map(lesson => {
                        const lp          = progress[lesson.id];
                        const isCompleted = lp?.completed;
                        const isCurrent   = currentLesson.id === lesson.id;
                        const isLocked    = !isCompleted && !isCurrent && !isActiveModule;

                        return (
                          <button
                            key={lesson.id}
                            className={`cp-lesson-row ${isCurrent ? 'current' : ''} ${isCompleted ? 'done' : ''} ${isLocked ? 'locked' : ''}`}
                            onClick={() => !isLocked && handleLessonSelect(lesson)}
                          >
                            {/* Status icon */}
                            <div className="cp-lesson-status">
                              {isCompleted ? (
                                /* check_circle filled — verde */
                                <span className="cp-s-done">✓</span>
                              ) : isCurrent ? (
                                /* play_circle filled — azul, animado */
                                <span className="cp-s-play">▶</span>
                              ) : isLocked ? (
                                <span className="cp-s-lock">🔒</span>
                              ) : (
                                <span className="cp-s-num">{lesson.order ?? idx + 1}</span>
                              )}
                            </div>
                            {/* Texto */}
                            <div className="cp-lesson-txt">
                              <span className={`cp-l-name ${isCompleted ? 'strikethrough' : ''} ${isCurrent ? 'current' : ''}`}>
                                {lesson.title}
                              </span>
                              <span className="cp-l-dur">
                                {lesson.duration_minutes || '—'}:00{isCurrent ? ' • Reproduciendo' : ''}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>


        </aside>
      </div>

      {/* Overlay móvil */}
      {typeof window !== 'undefined' && window.innerWidth < 1024 && sidebarOpen && (
        <div className="cp-overlay" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default CoursePlayer;