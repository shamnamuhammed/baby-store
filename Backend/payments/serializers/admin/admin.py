from rest_framework import serializers

from payments.models import Payment


class AdminPaymentSerializer(serializers.ModelSerializer):

    order_id = serializers.IntegerField(
        source="order.id",
        read_only=True,
    )

    customer_name = serializers.CharField(
        source="order.user.get_full_name",
        read_only=True,
    )

    customer_email = serializers.EmailField(
        source="order.user.email",
        read_only=True,
    )

    class Meta:

        model = Payment

        fields = (
            "id",
            "order_id",
            "customer_name",
            "customer_email",
            "amount",
            "payment_method",
            "status",
            "transaction_id",
            "refund_reason",
            "rejection_reason",
            "refunded_amount",
            "paid_at",
            "refunded_at",
            "created_at",
            "updated_at",
        )