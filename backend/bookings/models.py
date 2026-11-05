
from django.db import models
from django.contrib.auth.models import User


class Booking(models.Model):

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    provider = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='provider_bookings'
    )

    customer_name = models.CharField(max_length=150)
    customer_phone = models.CharField(max_length=15)
    service_name = models.CharField(max_length=150)

    booking_date = models.DateField()
    booking_time = models.TimeField()

    address = models.TextField()

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.customer_name} - {self.service_name}'

    class Meta:
        ordering = ['-created_at']
