from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Q
from django.core.exceptions import ValidationError

class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Post by {self.author.username} at {self.created_at}"

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.author.username} on post {self.post.id}"

class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes_given')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, blank=True, related_name='likes')
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, null=True, blank=True, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'post'], 
                name='unique_post_like', 
                condition=Q(post__isnull=False)
            ),
            models.UniqueConstraint(
                fields=['user', 'comment'], 
                name='unique_comment_like', 
                condition=Q(comment__isnull=False)
            ),
        ]

    def clean(self):
        if self.post and self.comment:
            raise ValidationError("Like cannot be for both a post and a comment.")
        if not self.post and not self.comment:
            raise ValidationError("Like must be for either a post or a comment.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
