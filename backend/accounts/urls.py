
from django.urls import path
from .views import RegisterView, ProfileView, EmailLoginView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', EmailLoginView.as_view(), name='email-login'),
    path('profile/', ProfileView.as_view(), name='profile'),
]
