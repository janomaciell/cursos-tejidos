import CourseCard from './CourseCard';
import Loader from '../components/common/Loader';
import './CourseList.css';

const CourseList = ({ courses, loading }) => {
  const list = Array.isArray(courses) ? courses : [];

  if (loading) {
    return (
      <div className="courses-loading">
        <Loader size="large" />
        <p>Cargando cursos...</p>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="courses-empty">
        <p>No se encontraron cursos</p>
      </div>
    );
  }

  return (
    <div className="courses-grid">
      {list.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
};

export default CourseList;