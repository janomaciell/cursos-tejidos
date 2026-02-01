from django.db import models
from django.utils import timezone
from apps.users.models import User
from apps.courses.models import Course

class Transaction(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('approved', 'Aprobado'),
        ('rejected', 'Rechazado'),
        ('cancelled', 'Cancelado'),
        ('refunded', 'Reembolsado'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='transactions')
    
    # Mercado Pago data
    mp_payment_id = models.CharField('ID de pago MP', max_length=100, unique=True)
    mp_preference_id = models.CharField('ID de preferencia MP', max_length=100, blank=True)
    mp_merchant_order_id = models.CharField('ID de orden MP', max_length=100, blank=True)
    
    amount = models.DecimalField('Monto', max_digits=10, decimal_places=2)
    status = models.CharField('Estado', max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField('Método de pago', max_length=50, blank=True)
    payment_type = models.CharField('Tipo de pago', max_length=50, blank=True)
    
    # Metadata
    raw_data = models.JSONField('Datos crudos', default=dict, blank=True)
    ip_address = models.GenericIPAddressField('IP', null=True, blank=True)
    
    created_at = models.DateTimeField('Fecha de creación', auto_now_add=True)
    updated_at = models.DateTimeField('Última actualización', auto_now=True)
    approved_at = models.DateTimeField('Fecha de aprobación', null=True, blank=True)

    class Meta:
        db_table = 'transactions'
        verbose_name = 'Transacción'
        verbose_name_plural = 'Transacciones'
        ordering = ['-created_at']

    def __str__(self):
        return f"Transaction {self.mp_payment_id} - {self.user.email} - {self.status}"

    def approve(self):
        """Aprobar transacción y dar acceso al curso"""
        self.status = 'approved'
        self.approved_at = timezone.now()
        self.save()
        
        # Crear o activar acceso al curso
        CourseAccess.objects.update_or_create(
            user=self.user,
            course=self.course,
            defaults={'is_active': True, 'purchased_at': timezone.now()}
        )


class CourseAccess(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='course_accesses')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='user_accesses')
    transaction = models.ForeignKey(Transaction, on_delete=models.SET_NULL, null=True, blank=True)
    
    is_active = models.BooleanField('Activo', default=True)
    purchased_at = models.DateTimeField('Fecha de compra', auto_now_add=True)
    expires_at = models.DateTimeField('Fecha de expiración', null=True, blank=True)
    
    created_at = models.DateTimeField('Fecha de creación', auto_now_add=True)
    updated_at = models.DateTimeField('Última actualización', auto_now=True)

    class Meta:
        db_table = 'course_accesses'
        verbose_name = 'Acceso a curso'
        verbose_name_plural = 'Accesos a cursos'
        unique_together = ['user', 'course']
        ordering = ['-purchased_at']

    def __str__(self):
        return f"{self.user.email} - {self.course.title}"

    @property
    def is_expired(self):
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False