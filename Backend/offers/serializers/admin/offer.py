from rest_framework import serializers

from offers.models import Offer


class OfferSerializer(serializers.ModelSerializer):

    class Meta:
        model = Offer
        fields = (
            "id",
            "name",
            "offer_type",
            "product",
            "category",
            "discount_type",
            "discount_value",
            "maximum_discount",
            "start_date",
            "end_date",
            "is_active",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
        )
        
        
class CreateOfferSerializer(serializers.ModelSerializer):

    class Meta:
        model = Offer
        exclude = (
            "id",
            "created_at",
            "updated_at",
        )

    def validate(self, attrs):

        if attrs["start_date"] >= attrs["end_date"]:
            raise serializers.ValidationError({
                "end_date": "End date must be after start date."
            })

        return attrs
    
class UpdateOfferSerializer(serializers.ModelSerializer):

    class Meta:
        model = Offer
        fields = (
            "name",
            "offer_type",
            "product",
            "category",
            "discount_type",
            "discount_value",
            "maximum_discount",
            "start_date",
            "end_date",
            "is_active",
        )

    def validate(self, attrs):

        start_date = attrs.get(
            "start_date",
            self.instance.start_date,
        )

        end_date = attrs.get(
            "end_date",
            self.instance.end_date,
        )

        if start_date >= end_date:
            raise serializers.ValidationError({
                "end_date": "End date must be after start date."
            })

        return attrs