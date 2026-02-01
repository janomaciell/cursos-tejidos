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
    path('status/<str:payment_id>/', views.payment_status, name='payment-status'),
    path('webhook/', mercadopago_webhook, name='mercadopago-webhook'),
    path('', include(router.urls)),
]
