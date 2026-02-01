from rest_framework import serializers
from .models import Transaction, CourseAccess
from apps.courses.serializers import CourseListSerializer

class TransactionSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Transaction
        fields = ('id', 'user_email', 'course', 'course_title', 'mp_payment_id', 
                 'amount', 'status', 'payment_method', 'created_at', 'approved_at')
        read_only_fields = ('id', 'user', 'mp_payment_id', 'status', 'created_at', 'approved_at')


class CourseAccessSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)
    progress = serializers.SerializerMethodField()

    class Meta:
        model = CourseAccess
        fields = ('id', 'course', 'is_active', 'purchased_at', 'progress')

    def get_progress(self, obj):
        from apps.courses.models import LessonProgress
        total_lessons = obj.course.total_lessons
        if total_lessons == 0:
            return 0
        completed_lessons = LessonProgress.objects.filter(
            user=obj.user,
            lesson__module__course=obj.course,
            completed=True
        ).count()
        return int((completed_lessons / total_lessons) * 100)


class CreatePaymentSerializer(serializers.Serializer):
    course_id = serializers.IntegerField()