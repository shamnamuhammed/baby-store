from rest_framework import serializers
from products.models import Category


class CategorySerializer(serializers.ModelSerializer):
    
    class Meta:
        model=Category
        fields =(
            "id",
            "name",
            "slug",
            "image",
            # "description",
            # "is_active",
            # "created_at",
            # "updated_at",
        )
        read_only_fields = (
            "id",
            "slug",
            "created_at",
            "updated_at",
            
        )