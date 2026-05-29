from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers
from .serializers import ConversationSerializer, MessageSerializer
from users.serializers import UserSerializer 
from .models import Conversation, Message
from users.models import User

# ... Je ConversationListView en ConversationStartView blijven hetzelfde ...

class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Sorteer op oudste eerst (of juist nieuwste, afhankelijk van je frontend scroll)
        # Meestal is .order_by('created_at') het beste voor een chat-stream
        return Message.objects.filter(conversation_id=self.kwargs["pk"]).order_by('created_at')

    def create(self, request, *args, **kwargs):
        # We overschrijven create() om te zorgen dat de response ALTIJD 
        # de volledige, diepe serializer data bevat (inclusief het complete sender object)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        convo = Conversation.objects.get(pk=self.kwargs["pk"])
        msg = serializer.save(sender=self.request.user, conversation=convo)
        convo.save()
        
        # Markeer andere berichten als gelezen
        Message.objects.filter(
            conversation=convo, is_read=False
        ).exclude(sender=self.request.user).update(is_read=True)
        
        # BELANGRIJK: Genereer de response opnieuw met de opgeslagen database-instantie 
        # zodat alle FK-relaties (zoals het volledige sender object) correct worden meegegeven.
        return Response(MessageSerializer(msg, context={'request': request}).data, status=201)

class ConversationListView(generics.ListAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.request.user.conversations.prefetch_related(
            "participants", "messages"
        )


class ConversationStartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        other_id = request.data.get("user_id")
        try:
            other = User.objects.get(pk=other_id)
        except User.DoesNotExist:
            return Response(status=404)
        convo = (
            Conversation.objects
            .filter(participants=request.user)
            .filter(participants=other)
            .first()
        )
        if not convo:
            convo = Conversation.objects.create()
            convo.participants.add(request.user, other)
        return Response(ConversationSerializer(convo, context={"request": request}).data)




class MessageSerializer(serializers.ModelSerializer):
    # Dit zorgt ervoor dat GET én POST het volledige user-object teruggeven!
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'text', 'created_at', 'is_read']
        read_only_fields = ['sender', 'conversation']