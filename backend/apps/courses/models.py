from django.db import models
from django.core.validators import MinValueValidator
from apps.users.models import User

class Course(models.Model):
    DIFFICULTY_CHOICES = [
        ('beginner', 'Principiante'),
        ('intermediate', 'Intermedio'),
        ('advanced', 'Avanzado'),
    ]

    title = models.CharField('Título', max_length=200)
    slug = models.SlugField('Slug', max_length=200, unique=True)
    description = models.TextField('Descripción')
    short_description = models.CharField('Descripción corta', max_length=300)
    cover_image = models.ImageField('Imagen de portada', upload_to='courses/covers/')
    price = models.DecimalField('Precio', max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    difficulty = models.CharField('Dificultad', max_length=20, choices=DIFFICULTY_CHOICES, default='beginner')
    duration_hours = models.PositiveIntegerField('Duración (horas)', default=0)
    is_active = models.BooleanField('Activo', default=True)
    is_featured = models.BooleanField('Destacado', default=False)
    created_at = models.DateTimeField('Fecha de creación', auto_now_add=True)
    updated_at = models.DateTimeField('Última actualización', auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='courses_created')

    class Meta:
        db_table = 'courses'
        verbose_name = 'Curso'
        verbose_name_plural = 'Cursos'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def total_lessons(self):
        return Lesson.objects.filter(module__course=self).count()

    @property
    def total_students(self):
        from apps.payments.models import CourseAccess
        return CourseAccess.objects.filter(course=self, is_active=True).count()


class Module(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField('Título', max_length=200)
    description = models.TextField('Descripción', blank=True)
    order = models.PositiveIntegerField('Orden', default=0)
    created_at = models.DateTimeField('Fecha de creación', auto_now_add=True)

    class Meta:
        db_table = 'modules'
        verbose_name = 'Módulo'
        verbose_name_plural = 'Módulos'
        ordering = ['course', 'order']
        unique_together = ['course', 'order']

    def __str__(self):
        return f"{self.course.title} - {self.title}"


class Lesson(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField('Título', max_length=200)
    description = models.TextField('Descripción', blank=True)
    video_id = models.CharField('ID del video', max_length=200, help_text='ID del video en Cloudflare Stream')
    duration_minutes = models.PositiveIntegerField('Duración (minutos)', default=0)
    order = models.PositiveIntegerField('Orden', default=0)
    is_preview = models.BooleanField('Vista previa gratis', default=False)
    created_at = models.DateTimeField('Fecha de creación', auto_now_add=True)

    class Meta:
        db_table = 'lessons'
        verbose_name = 'Lección'
        verbose_name_plural = 'Lecciones'
        ordering = ['module', 'order']
        unique_together = ['module', 'order']

    def __str__(self):
        return f"{self.module.course.title} - {self.module.title} - {self.title}"


class LessonProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='user_progress')
    completed = models.BooleanField('Completada', default=False)
    progress_percentage = models.PositiveIntegerField('Porcentaje de progreso', default=0)
    last_watched_at = models.DateTimeField('Última visualización', auto_now=True)
    created_at = models.DateTimeField('Fecha de inicio', auto_now_add=True)

    class Meta:
        db_table = 'lesson_progress'
        verbose_name = 'Progreso de lección'
        verbose_name_plural = 'Progresos de lecciones'
        unique_together = ['user', 'lesson']

    def __str__(self):
        return f"{self.user.email} - {self.lesson.title} - {self.progress_percentage}%"