
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import ProviderProfile


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    phone = serializers.CharField(required=False, allow_blank=True)
    service_category = serializers.CharField(
        required=False,
        allow_blank=True
    )

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name',
            'email', 'password', 'phone', 'service_category'
        ]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                'This email is already registered.'
            )
        return value

    def create(self, validated_data):
        phone = validated_data.pop('phone', '')
        category = validated_data.pop('service_category', '')

        user = User.objects.create_user(**validated_data)

        ProviderProfile.objects.create(
            user=user,
            phone=phone,
            service_category=category
        )

        return user


class ProfileSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(
        source='provider_profile.phone',
        required=False,
        allow_blank=True
    )
    address = serializers.CharField(
        source='provider_profile.address',
        required=False,
        allow_blank=True
    )
    service_category = serializers.CharField(
        source='provider_profile.service_category',
        required=False,
        allow_blank=True
    )
    experience = serializers.CharField(
        source='provider_profile.experience',
        required=False,
        allow_blank=True
    )
    about = serializers.CharField(
        source='provider_profile.about',
        required=False,
        allow_blank=True
    )

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name',
            'email', 'phone', 'address', 'service_category',
            'experience', 'about'
        ]

    def update(self, instance, validated_data):
        profile_data = validated_data.pop(
            'provider_profile', {}
        )

        for field, value in validated_data.items():
            setattr(instance, field, value)

        instance.save()

        profile, created = ProviderProfile.objects.get_or_create(
            user=instance
        )

        for field, value in profile_data.items():
            setattr(profile, field, value)

        profile.save()

        return instance
