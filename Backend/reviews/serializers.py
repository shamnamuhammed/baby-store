from rest_framework import serializers
from reviews.models import Review


class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.CharField(
        source="user.get_full_name",
        read_only=True,
    )

    class Meta:
        model = Review
        fields = (
            "id",
            "user",
            "rating",
            "comment",
            "created_at",
        )
        
class CreateReviewSerializer(serializers.ModelSerializer):

    class Meta:
        model = Review
        fields = (
            "rating",
            "comment",
        )