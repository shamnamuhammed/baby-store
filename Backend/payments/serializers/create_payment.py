from rest_framework import serializers

from payments.models import Payment


class CreatePaymentSerializer(serializers.Serializer):

    order_id = serializers.IntegerField()

    payment_method = serializers.ChoiceField(
        choices=Payment.PaymentMethod.choices,
    )