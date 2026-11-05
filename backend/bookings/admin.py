
from django.contrib import admin
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        'customer_name',
        'service_name',
        'provider',
        'booking_date',
        'status',
        'amount'
    )

    list_filter = ('status', 'booking_date')
    search_fields = ('customer_name', 'customer_phone')
