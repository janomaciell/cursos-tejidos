from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .webhooks import mercadopago_webhook

app_name = 'payments'

router = DefaultRouter()
router.register(r'transactions', views.TransactionViewSet, basename='transaction')
router.register(r'access', views.CourseAccessViewSet, basename='access')

urlpatterns = [
    path('create/', views.create_payment, name='create-payment'),
    path('my-courses/', views.my_courses, name='my-courses'),
    path('check-preference/<str:preference_id>/', views.check_preference_status, name='check_preference_status'),
    path('webhook/', mercadopago_webhook, name='mercadopago-webhook'),
    path('', include(router.urls)),
]