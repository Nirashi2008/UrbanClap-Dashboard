
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import BookingViewSet, DashboardStatsView

router = DefaultRouter()
router.register('bookings', BookingViewSet, basename='booking')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard-stats/', DashboardStatsView.as_view()),
]
