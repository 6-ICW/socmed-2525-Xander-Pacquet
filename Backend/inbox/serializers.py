from rest_framework import serializers
from users.serializers import UserSerializer
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ["id", "sender", "text", "is_read", "created_at"]
        read_only_fields = ["id", "sender", "created_at"]


class ConversationSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    last_message_time = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ["id", "other_user", "last_message", "last_message_time", "unread_count"]

    def get_other_user(self, obj):
        req = self.context.get("request")
        user = obj.get_other_user(req.user)
        return UserSerializer(user, context=self.context).data if user else None

    def get_last_message(self, obj):
        msg = obj.last_message()
        return msg.text if msg else ""

    def get_last_message_time(self, obj):
        msg = obj.last_message()
        return msg.created_at.isoformat() if msg else obj.created_at.isoformat()

    def get_unread_count(self, obj):
        req = self.context.get("request")
        return obj.messages.filter(is_read=False).exclude(sender=req.user).count()