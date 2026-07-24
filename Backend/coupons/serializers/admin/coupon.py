from rest_framework import serializers

from coupons.models import Coupon


class CouponSerializer(serializers.ModelSerializer):

    class Meta:
        model = Coupon
        fields = (            
            "id",
            "code",
            "discount_type",
            "discount_value",
            "minimum_order_amount",
            "maximum_discount",
            "usage_limit",
            "usage_per_user",
            "used_count",
            "valid_from",
            "valid_to",
            "is_active",
            "created_at",
            "updated_at",)
        
        read_only_fields = (
            "id",
            "used_count",
            "created_at",
            "updated_at",
        )


class CreateCouponSerializer(serializers.ModelSerializer):

    class Meta:
        model = Coupon
        exclude = (
            "id",
            "used_count",
            "created_at",
            "updated_at",
        )
        
    def validate(self, attrs):
        print(attrs)

        if attrs["valid_from"] >= attrs["valid_to"]:
            raise serializers.ValidationError(
                {
                    "valid_to": "Valid To must be greater than Valid From."
                }
            )

        if attrs["discount_value"] <= 0:
            raise serializers.ValidationError(
                {
                    "discount_value": "Discount must be greater than zero."
                }
            )
            
        if (
            attrs["discount_type"] == Coupon.DiscountType.FIXED
            and attrs.get("maximum_discount") is not None
        ):
            raise serializers.ValidationError({
                "maximum_discount":
                "Maximum discount is only allowed for percentage coupons."
            })
            
        if (
                attrs["discount_type"] == Coupon.DiscountType.PERCENTAGE
                and  attrs.get("maximum_discount") is None
            ):
                raise serializers.ValidationError({
                    "maximum_discount":
                    "Maximum discount is required for percentage coupons."
                })

        if (
            attrs["discount_type"] == Coupon.DiscountType.PERCENTAGE
            and attrs["discount_value"] > 100
        ):
            raise serializers.ValidationError(
                {
                    "discount_value": "Percentage cannot exceed 100."
                }
            )

        return attrs


class UpdateCouponSerializer(serializers.ModelSerializer):

    class Meta:
        model = Coupon
        fields = (
            "discount_type",
            "discount_value",
            "minimum_order_amount",
            "maximum_discount",
            "valid_from",
            "valid_to",
            "usage_limit",
            "usage_per_user",
            "is_active",
        )
        
    def validate(self, attrs):

        valid_from = attrs.get(
            "valid_from",
            self.instance.valid_from,
        )

        valid_to = attrs.get(
            "valid_to",
            self.instance.valid_to,
        )

        if valid_from and valid_to and  valid_from >= valid_to:
            raise serializers.ValidationError(
                {
                    "valid_to": "Valid To must be after Valid From."
                }
            )

        discount_type = attrs.get(
            "discount_type",
            self.instance.discount_type,
        )

        discount_value = attrs.get(
            "discount_value",
            self.instance.discount_value,
        )

        if (
            discount_type == Coupon.DiscountType.PERCENTAGE
            and discount_value > 100
        ):
            raise serializers.ValidationError(
                {
                    "discount_value": "Percentage cannot exceed 100."
                }
            )
            
        maximum_discount = attrs.get(
            "maximum_discount",
            self.instance.maximum_discount,
        )
            
        if (
            discount_type == Coupon.DiscountType.FIXED
            and maximum_discount is not None
        ):
            raise serializers.ValidationError(
                {
                    "maximum_discount": "Maximum discount is only allowed for percentage coupons."
                }
            )

        if (
            discount_type == Coupon.DiscountType.PERCENTAGE
            and maximum_discount is None
        ):
            raise serializers.ValidationError(
                {
                    "maximum_discount": "Maximum discount is required for percentage coupons."
                }
            )

        return attrs
        