import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coursesAPI } from '../../api/courses';
import VideoPlayer from '../../courses/VideoPlayer';
import Loader from '../../components/common/Loader';
import { FiChevronLeft, FiChevronRight, FiCheck, FiLock } from 'react-icons/fi';
import './CoursePlayer.css';

const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const [courseData, modulesData, progressData] = await Promise.all([
        coursesAPI.getCourseBySlug(courseId),
        coursesAPI.getCourseModules(courseId),
        coursesAPI.getLessonProgress(courseId)
      ]);

      setCourse(courseData);
      setModules(modulesData);

      // Crear mapa de progreso
      const progressMap = {};
      progressData.forEach((p) => {
        progressMap[p.lesson] = p;
      });
      setProgress(progressMap);

      // Seleccionar primera lección no completada o la primera
      const firstIncomplete = findFirstIncompleteLesson(modulesData, progressMap);
      setCurrentLesson(firstIncomplete || modulesData[0]?.lessons[0] || null);
    } catch (error) {
      console.error('Error al cargar curso:', error);
      navigate('/mis-cursos');
    } finally {
      setLoading(false);
    }
  };

  const findFirstIncompleteLesson = (modules, progressMap) => {
    for (const module of modules) {
      for (const lesson of module.lessons) {
        if (!progressMap[lesson.id]?.completed) {
          return lesson;
        }
      }
    }
    return null;
  };

  const handleLessonSelect = (lesson) => {
    setCurrentLesson(lesson);
  };

  const handleProgress = async (progressPercentage) => {
    if (!currentLesson) return;

    try {
      await coursesAPI.updateLessonProgress({
        lesson: currentLesson.id,
        progress_percentage: progressPercentage,
        completed: progressPercentage >= 90
      });

      // Actualizar progreso local
      setProgress({
        ...progress,
        [currentLesson.id]: {
          ...progress[currentLesson.id],
          progress_percentage: progressPercentage,
          completed: progressPercentage >= 90
        }
      });
    } catch (error) {
      console.error('Error al actualizar progreso:', error);
    }
  };

  const goToNextLesson = () => {
    if (!currentLesson) return;

    let found = false;
    for (const module of modules) {
      for (const lesson of module.lessons) {
        if (found) {
          setCurrentLesson(lesson);
          return;
        }
        if (lesson.id === currentLesson.id) {
          found = true;
        }
      }
    }
  };

  const goToPreviousLesson = () => {
    if (!currentLesson) return;

    let previousLesson = null;
    for (const module of modules) {
      for (const lesson of module.lessons) {
        if (lesson.id === currentLesson.id && previousLesson) {
          setCurrentLesson(previousLesson);
          return;
        }
        previousLesson = lesson;
      }
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!course || !currentLesson) {
    return (
      <div className="player-error">
        <h2>Error al cargar el curso</h2>
        <button onClick={() => navigate('/mis-cursos')}>Volver a Mis Cursos</button>
      </div>
    );
  }

  return (
    <div className="course-player-page">
      <div className="player-container">
        <div className="video-section">
          <div className="video-header">
            <button onClick={() => navigate('/mis-cursos')} className="back-button">
              <FiChevronLeft /> Volver
            </button>
            <h2>{course.title}</h2>
          </div>

          <VideoPlayer lessonId={currentLesson.id} onProgress={handleProgress} />

          <div className="lesson-info">
            <h3>{currentLesson.title}</h3>
            {currentLesson.description && <p>{currentLesson.description}</p>}
          </div>

          <div className="video-controls">
            <button onClick={goToPreviousLesson} className="nav-button">
              <FiChevronLeft /> Anterior
            </button>
            <button onClick={goToNextLesson} className="nav-button">
              Siguiente <FiChevronRight />
            </button>
          </div>
        </div>

        <div className="sidebar">
          <h3>Contenido del Curso</h3>
          <div className="modules-list">
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="module-section">
                <h4>
                  Módulo {moduleIndex + 1}: {module.title}
                </h4>
                <ul className="lessons-list">
                  {module.lessons.map((lesson) => {
                    const lessonProgress = progress[lesson.id];
                    const isCompleted = lessonProgress?.completed;
                    const isCurrent = currentLesson.id === lesson.id;

                    return (
                      <li
                        key={lesson.id}
                        className={`lesson-item ${isCurrent ? 'active' : ''} ${
                          isCompleted ? 'completed' : ''
                        }`}
                        onClick={() => handleLessonSelect(lesson)}
                      >
                        <div className="lesson-status">
                          {isCompleted ? (
                            <FiCheck className="check-icon" />
                          ) : lesson.is_preview ? (
                            <FiLock className="lock-icon open" />
                          ) : (
                            <span className="lesson-number">{lesson.order}</span>
                          )}
                        </div>
                        <div className="lesson-details">
                          <span className="lesson-title">{lesson.title}</span>
                          <span className="lesson-duration">{lesson.duration_minutes} min</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;