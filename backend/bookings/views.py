
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.db.models import Sum, Q

from .models import Booking
from .serializers import BookingSerializer


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(
            provider=self.request.user
        )

    def perform_create(self, serializer):
        serializer.save(provider=self.request.user)


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bookings = Booking.objects.filter(
            provider=request.user
        )

        total = bookings.count()
        pending = bookings.filter(status='PENDING').count()
        in_progress = bookings.filter(
            status='IN_PROGRESS'
        ).count()
        completed = bookings.filter(
            status='COMPLETED'
        ).count()
        cancelled = bookings.filter(
            status='CANCELLED'
        ).count()

        total_earnings = bookings.filter(
            status='COMPLETED'
        ).aggregate(total=Sum('amount'))['total'] or 0

        recent_bookings = BookingSerializer(
            bookings[:5],
            many=True
        ).data

        return Response({
            'total_bookings': total,
            'pending_bookings': pending,
            'in_progress_bookings': in_progress,
            'completed_bookings': completed,
            'cancelled_bookings': cancelled,
            'total_earnings': total_earnings,
            'recent_bookings': recent_bookings,
        })
