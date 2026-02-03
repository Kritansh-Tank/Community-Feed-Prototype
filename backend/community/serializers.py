from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Post, Comment, Like

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ['id', 'user', 'post', 'comment', 'created_at']

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    like_count = serializers.IntegerField(read_only=True)
    replies = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'post', 'parent', 'author', 'text', 'created_at', 'like_count', 'replies', 'is_liked']

    def get_replies(self, obj):
        # This is where N+1 can happen if we are not careful.
        # We will handle the "efficient" tree building in the view/queryset logic.
        # But for the serializer to work recursively, we need to pass the pre-built tree in context.
        if hasattr(obj, 'precomputed_replies'):
            return CommentSerializer(obj.precomputed_replies, many=True, context=self.context).data
        return []

    def get_is_liked(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if user and user.is_authenticated:
            if hasattr(obj, 'user_liked'):
                return obj.user_liked
            return obj.likes.filter(user=user).exists()
        return False

class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    like_count = serializers.IntegerField(read_only=True)
    comment_count = serializers.IntegerField(read_only=True)
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'author', 'text', 'created_at', 'like_count', 'comment_count', 'is_liked']

    def get_is_liked(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if user and user.is_authenticated:
            if hasattr(obj, 'user_liked'):
                return obj.user_liked
            return obj.likes.filter(user=user).exists()
        return False
