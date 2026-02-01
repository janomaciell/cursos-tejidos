from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """Permiso para que solo el propietario pueda editar"""
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj == request.user


class IsCourseOwner(permissions.BasePermission):
    """Permiso para verificar si el usuario tiene acceso al curso"""
    
    def has_object_permission(self, request, view, obj):
        from apps.payments.models import CourseAccess
        
        # Permitir si es admin
        if request.user.is_staff:
            return True
        
        # Verificar si tiene acceso al curso
        return CourseAccess.objects.filter(
            user=request.user,
            course=obj,
            is_active=True
        ).exists()