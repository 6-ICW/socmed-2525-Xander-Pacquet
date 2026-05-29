from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User


class UserSerializer(serializers.ModelSerializer):
    followers_count = serializers.ReadOnlyField()
    following_count = serializers.ReadOnlyField()
    likes_count = serializers.ReadOnlyField()
    posts_count = serializers.ReadOnlyField()
    is_following = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "display_name", "avatar", "bio",
            "is_verified", "followers_count", "following_count",
            "likes_count", "posts_count", "is_following",
        ]

    def get_is_following(self, obj):
        req = self.context.get("request")
        if req and req.user.is_authenticated:
            return obj.followers.filter(follower=req.user).exists()
        return False

    def get_avatar(self, obj):
        if obj.avatar:
            req = self.context.get("request")
            return req.build_absolute_uri(obj.avatar.url) if req else obj.avatar.url
        return None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Deze gebruikersnaam bestaat al.")
        if len(value) < 3:
            raise serializers.ValidationError("Gebruikersnaam moet minstens 3 tekens zijn.")
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Wachtwoord moet minstens 8 tekens zijn.")
        return value

    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Dit e-mailadres is al in gebruik.")
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
            display_name=validated_data["username"],
        )


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        return token