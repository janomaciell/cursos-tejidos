from django.contrib import admin
from .models import Course, Module, Lesson, LessonProgress

class ModuleInline(admin.TabularInline):
    model = Module
    extra = 1
    fields = ('title', 'order')

class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 1
    fields = ('title', 'video_id', 'duration_minutes', 'order', 'is_preview')

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'price', 'difficulty', 'is_active', 'is_featured', 'total_students', 'created_at')
    list_filter = ('difficulty', 'is_active', 'is_featured', 'created_at')
    search_fields = ('title', 'description')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [ModuleInline]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('title', 'slug', 'description', 'short_description')
        }),
        ('Detalles', {
            'fields': ('cover_image', 'price', 'difficulty', 'duration_hours')
        }),
        ('Estado', {
            'fields': ('is_active', 'is_featured', 'created_by')
        }),
    )

@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order', 'created_at')
    list_filter = ('course', 'created_at')
    search_fields = ('title', 'course__title')
    inlines = [LessonInline]

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'module', 'video_id', 'duration_minutes', 'order', 'is_preview')
    list_filter = ('module__course', 'is_preview', 'created_at')
    search_fields = ('title', 'module__title')

@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'lesson', 'progress_percentage', 'completed', 'last_watched_at')
    list_filter = ('completed', 'last_watched_at')
    search_fields = ('user__email', 'lesson__title')