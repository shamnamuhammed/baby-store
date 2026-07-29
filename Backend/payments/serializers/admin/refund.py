from rest_framework import serializers

from payments.models import Payment


class AdminRefundSerializer(serializers.ModelSerializer):

    customer = serializers.CharField(
        source="order.user.username",
        read_only=True,
    )

    order_id = serializers.IntegerField(
        source="order.id",
        read_only=True,
    )

    class Meta:

        model = Payment

        fields = (
            "id",
            "order_id",
            "customer",
            "amount",
            "payment_method",
            "status",
            "refund_reason",
            "refunded_amount",
            "transaction_id",
            "created_at",
            "refunded_at",
        )