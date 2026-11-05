
from django.contrib import admin
from .models import ProviderProfile

@admin.register(ProviderProfile)
class ProviderProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone', 'service_category')
    search_fields = ('user__username', 'user__email', 'phone')
