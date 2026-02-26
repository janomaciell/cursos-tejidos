from django.contrib import admin
from .models import Course, Module, Lesson, LessonProgress, LessonDocument


# ── Inlines ────────────────────────────────────────────────────────────────────

class ModuleInline(admin.TabularInline):
    model  = Module
    extra  = 1
    fields = ('title', 'order')


class LessonInline(admin.TabularInline):
    model  = Lesson
    extra  = 1
    fields = ('title', 'lesson_type', 'video_id', 'duration_minutes', 'order', 'is_preview')


class LessonDocumentInline(admin.TabularInline):
    model   = LessonDocument
    extra   = 1
    fields  = ('title', 'file')
    verbose_name        = 'Documento adjunto'
    verbose_name_plural = 'Documentos adjuntos'


# ── Course ─────────────────────────────────────────────────────────────────────

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display   = ('title', 'price', 'difficulty', 'is_active', 'is_featured', 'total_students', 'created_at')
    list_filter    = ('difficulty', 'is_active', 'is_featured', 'created_at')
    search_fields  = ('title', 'description')
    prepopulated_fields = {'slug': ('title',)}
    inlines        = [ModuleInline]

    fieldsets = (
        ('Información Básica', {
            'fields': ('title', 'slug', 'description', 'short_description'),
        }),
        ('Detalles', {
            'fields': ('cover_image', 'price', 'difficulty', 'duration_hours'),
        }),
        ('Estado', {
            'fields': ('is_active', 'is_featured', 'created_by'),
        }),
    )


# ── Module ─────────────────────────────────────────────────────────────────────

@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display  = ('title', 'course', 'order', 'created_at')
    list_filter   = ('course', 'created_at')
    search_fields = ('title', 'course__title')
    inlines       = [LessonInline]


# ── Lesson ─────────────────────────────────────────────────────────────────────

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display  = ('title', 'module', 'lesson_type', 'video_id', 'duration_minutes', 'order', 'is_preview')
    list_filter   = ('lesson_type', 'module__course', 'is_preview', 'created_at')
    search_fields = ('title', 'module__title')
    inlines       = [LessonDocumentInline]

    fieldsets = (
        ('Información', {
            'fields': ('module', 'title', 'description', 'lesson_type', 'order', 'is_preview'),
        }),
        ('Video (solo si tipo = Video)', {
            'fields': ('video_id', 'duration_minutes'),
            'classes': ('collapse',),
        }),
    )


# ── LessonDocument (standalone) ────────────────────────────────────────────────

@admin.register(LessonDocument)
class LessonDocumentAdmin(admin.ModelAdmin):
    list_display  = ('__str__', 'lesson', 'file_type', 'created_at')
    list_filter   = ('lesson__module__course', 'created_at')
    search_fields = ('title', 'lesson__title')
    readonly_fields = ('file_type', 'name', 'created_at')


# ── Progress ───────────────────────────────────────────────────────────────────

@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display  = ('user', 'lesson', 'progress_percentage', 'completed', 'last_watched_at')
    list_filter   = ('completed', 'last_watched_at')
    search_fields = ('user__email', 'lesson__title')