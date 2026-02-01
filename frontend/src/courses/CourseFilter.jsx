import { useState } from 'react';
import { FiFilter } from 'react-icons/fi';
import Button from '../components/common/Button';
import './CourseFilter.css';

const CourseFilter = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    difficulty: '',
    min_price: '',
    max_price: '',
    is_featured: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newFilters = {
      ...filters,
      [name]: type === 'checkbox' ? checked : value
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      difficulty: '',
      min_price: '',
      max_price: '',
      is_featured: false
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="course-filter">
      <div className="filter-header">
        <FiFilter />
        <h3>Filtros</h3>
      </div>

      <div className="filter-group">
        <label>Dificultad</label>
        <select name="difficulty" value={filters.difficulty} onChange={handleChange}>
          <option value="">Todas</option>
          <option value="beginner">Principiante</option>
          <option value="intermediate">Intermedio</option>
          <option value="advanced">Avanzado</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Precio Mínimo (ARS)</label>
        <input
          type="number"
          name="min_price"
          value={filters.min_price}
          onChange={handleChange}
          placeholder="0"
        />
      </div>

      <div className="filter-group">
        <label>Precio Máximo (ARS)</label>
        <input
          type="number"
          name="max_price"
          value={filters.max_price}
          onChange={handleChange}
          placeholder="100000"
        />
      </div>

      <div className="filter-group-checkbox">
        <input
          type="checkbox"
          id="is_featured"
          name="is_featured"
          checked={filters.is_featured}
          onChange={handleChange}
        />
        <label htmlFor="is_featured">Solo destacados</label>
      </div>

      <Button variant="secondary" fullWidth onClick={handleReset}>
        Limpiar Filtros
      </Button>
    </div>
  );
};

export default CourseFilter;