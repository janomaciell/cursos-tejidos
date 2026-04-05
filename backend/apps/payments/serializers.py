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
    """Acepta course_id (individual) O course_ids (carrito).
    
    El frontend puede enviar:
      - { "course_id": 5 }              → pago de un solo curso
      - { "course_ids": [5, 8, 12] }    → pago de carrito (múltiples cursos)
    """
    course_id = serializers.IntegerField(required=False)
    course_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=False,
    )

    def validate(self, attrs):
        cid = attrs.get('course_id')
        cids = attrs.get('course_ids')

        if not cid and not cids:
            raise serializers.ValidationError(
                "Debe enviar 'course_id' o 'course_ids'."
            )

        # Normalize: always store a list in 'course_ids'
        if cid and not cids:
            attrs['course_ids'] = [cid]
        elif cids and not cid:
            pass  # already a list
        # If both were sent, merge (deduplicate later in the view)
        elif cid and cids:
            if cid not in cids:
                cids.append(cid)
            attrs['course_ids'] = cids

        return attrs