from rest_framework import serializers

from payments.models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    
    
    order_id = serializers.IntegerField(
        source="order.id",
        read_only=True,
    )

    order_status = serializers.CharField(
        source="order.status",
        read_only=True,
    )

    class Meta:

        model = Payment

        fields = (
            "id",
            "order_id",
            "order_status",
            "amount",
            "payment_method",
            "status",
            "transaction_id",
            "created_at",
            "updated_at",
            "refund_reason",
            "refund_amount",
            "refunded_at",
        )

        read_only_fields = (
            "id",
            "status",
            "transaction_id",
            "created_at",
            "updated_at",
        )