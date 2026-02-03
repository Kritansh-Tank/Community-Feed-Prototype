from rest_framework import viewsets, status, response
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q, Prefetch, Sum, Case, When, IntegerField, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User
from .models import Post, Comment, Like
from .serializers import PostSerializer, CommentSerializer, UserSerializer, LikeSerializer

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().annotate(
        like_count=Count('likes', distinct=True),
        comment_count=Count('comments', distinct=True)
    ).select_related('author').order_by('-created_at')
    serializer_class = PostSerializer

    def create(self, request, *args, **kwargs):
        # Allow either an authenticated Django user OR a `user` payload (from Supabase) to create posts
        user = request.user if (request.user and request.user.is_authenticated) else None
        user_data = request.data.get('user')

        if not user and not user_data:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

        text = request.data.get('text')
        if not text:
            return Response({'error': 'Text is required'}, status=status.HTTP_400_BAD_REQUEST)

        if not user and user_data:
            # Sync Supabase user with Django user
            username = (user_data.get('email') or '').split('@')[0]
            if not username:
                username = (user_data.get('id') or '')[:15]
            user, _ = User.objects.get_or_create(
                username=username,
                defaults={'email': user_data.get('email', '')}
            )

        post = Post.objects.create(author=user, text=text)
        serializer = self.get_serializer(post)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        post = self.get_object()
        # Fetch all comments for this post in ONE query
        comments = Comment.objects.filter(post=post).annotate(
            like_count=Count('likes', distinct=True)
        ).select_related('author').order_by('created_at')

        # Build the tree structure efficiently in memory
        comment_dict = {comment.id: comment for comment in comments}
        root_comments = []

        for comment in comments:
            comment.precomputed_replies = []
            if comment.parent_id:
                parent = comment_dict.get(comment.parent_id)
                if parent:
                    if not hasattr(parent, 'precomputed_replies'):
                        parent.precomputed_replies = []
                    parent.precomputed_replies.append(comment)
            else:
                root_comments.append(comment)

        serializer = CommentSerializer(root_comments, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        user = request.user if (request.user and request.user.is_authenticated) else None
        user_data = request.data.get('user')

        if not user and user_data:
            username = (user_data.get('email') or '').split('@')[0]
            if not username:
                username = (user_data.get('id') or '')[:15]
            user, _ = User.objects.get_or_create(
                username=username,
                defaults={'email': user_data.get('email', '')}
            )

        if not user:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

        like, created = Like.objects.get_or_create(user=user, post=post)
        if not created:
            like.delete()
            return Response({'liked': False}, status=status.HTTP_200_OK)
        return Response({'liked': True}, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        """Allow deletion only by the post author or staff. Accepts `user` payload as fallback."""
        instance = self.get_object()
        user = request.user if (request.user and request.user.is_authenticated) else None
        user_data = request.data.get('user')

        if not user and user_data:
            username = (user_data.get('email') or '').split('@')[0]
            if not username:
                username = (user_data.get('id') or '')[:15]
            user, _ = User.objects.get_or_create(
                username=username,
                defaults={'email': user_data.get('email', '')}
            )

        if not user:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

        if user != instance.author and not user.is_staff:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer

    def create(self, request, *args, **kwargs):
        user = request.user if (request.user and request.user.is_authenticated) else None
        user_data = request.data.get('user')

        if not user and not user_data:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user and user_data:
            username = (user_data.get('email') or '').split('@')[0]
            if not username:
                username = (user_data.get('id') or '')[:15]
            user, _ = User.objects.get_or_create(
                username=username,
                defaults={'email': user_data.get('email', '')}
            )

        data = request.data.copy()
        data['author'] = user.id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(author=user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        comment = self.get_object()
        user = request.user if (request.user and request.user.is_authenticated) else None
        user_data = request.data.get('user')

        if not user and user_data:
            username = (user_data.get('email') or '').split('@')[0]
            if not username:
                username = (user_data.get('id') or '')[:15]
            user, _ = User.objects.get_or_create(
                username=username,
                defaults={'email': user_data.get('email', '')}
            )

        if not user:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

        like, created = Like.objects.get_or_create(user=user, comment=comment)
        if not created:
            like.delete()
            return Response({'liked': False}, status=status.HTTP_200_OK)
        return Response({'liked': True}, status=status.HTTP_201_CREATED)

class LeaderboardViewSet(viewsets.ViewSet):
    def list(self, request):
        last_24h = timezone.now() - timedelta(hours=24)
        
        # Correct approach for dynamic 24h karma using correlated subqueries
        from django.db.models import OuterRef, Subquery, F
        
        post_karma_sub = Like.objects.filter(
            created_at__gte=last_24h,
            post__author=OuterRef('pk')
        ).values('post__author').annotate(total=Count('id')*5).values('total')
        
        comment_karma_sub = Like.objects.filter(
            created_at__gte=last_24h,
            comment__author=OuterRef('pk')
        ).values('comment__author').annotate(total=Count('id')).values('total')
        
        top_users = User.objects.annotate(
            p_karma=Coalesce(Subquery(post_karma_sub, output_field=IntegerField()), 0),
            c_karma=Coalesce(Subquery(comment_karma_sub, output_field=IntegerField()), 0)
        ).annotate(
            total_karma=F('p_karma') + F('c_karma')
        ).filter(total_karma__gt=0).order_by('-total_karma')[:5]

        data = []
        for u in top_users:
            data.append({
                'id': u.id,
                'username': u.username,
                'karma': u.total_karma
            })
            
        return Response(data)
