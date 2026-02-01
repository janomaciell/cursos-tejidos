from rest_framework import serializers
from .models import Course, Module, Lesson, LessonProgress

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ('id', 'title', 'description', 'duration_minutes', 'order', 'is_preview')


class LessonDetailSerializer(serializers.ModelSerializer):
    video_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Lesson
        fields = ('id', 'title', 'description', 'video_id', 'video_url', 'duration_minutes', 'order', 'is_preview')

    def get_video_url(self, obj):
        # Solo devolver video_id si el usuario tiene acceso o es preview
        request = self.context.get('request')
        if obj.is_preview or (request and request.user.is_authenticated):
            return obj.video_id
        return None


class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    lessons_count = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = ('id', 'title', 'description', 'order', 'lessons', 'lessons_count')

    def get_lessons_count(self, obj):
        return obj.lessons.count()


class CourseListSerializer(serializers.ModelSerializer):
    total_lessons = serializers.ReadOnlyField()
    total_students = serializers.ReadOnlyField()

    class Meta:
        model = Course
        fields = ('id', 'title', 'slug', 'short_description', 'cover_image', 'price', 
                 'difficulty', 'duration_hours', 'total_lessons', 'total_students', 
                 'is_featured', 'created_at')


class CourseDetailSerializer(serializers.ModelSerializer):
    modules = ModuleSerializer(many=True, read_only=True)
    total_lessons = serializers.ReadOnlyField()
    total_students = serializers.ReadOnlyField()
    has_access = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ('id', 'title', 'slug', 'description', 'short_description', 'cover_image', 
                 'price', 'difficulty', 'duration_hours', 'modules', 'total_lessons', 
                 'total_students', 'is_featured', 'has_access', 'created_at')

    def get_has_access(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from apps.payments.models import CourseAccess
            return CourseAccess.objects.filter(
                user=request.user,
                course=obj,
                is_active=True
            ).exists()
        return False


class LessonProgressSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)

    class Meta:
        model = LessonProgress
        fields = ('id', 'lesson', 'lesson_title', 'completed', 'progress_percentage', 
                 'last_watched_at', 'created_at')
        read_only_fields = ('id', 'created_at', 'last_watched_at')