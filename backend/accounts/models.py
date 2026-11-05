
from django.db import models
from django.contrib.auth.models import User


class ProviderProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='provider_profile'
    )

    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    service_category = models.CharField(max_length=100, blank=True)
    experience = models.CharField(max_length=100, blank=True)
    about = models.TextField(blank=True)

    profile_image = models.ImageField(
        upload_to='provider_profiles/',
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.username
