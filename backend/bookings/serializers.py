
from rest_framework import serializers
from .models import Booking


class BookingSerializer(serializers.ModelSerializer):

    class Meta:
        model = Booking
        fields = [
            'id',
            'customer_name',
            'customer_phone',
            'service_name',
            'booking_date',
            'booking_time',
            'address',
            'amount',
            'status',
            'created_at',
        ]

        read_only_fields = ['id', 'created_at']
