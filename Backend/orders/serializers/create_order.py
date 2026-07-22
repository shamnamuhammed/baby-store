from rest_framework import serializers


class CreateOrderSerializer(serializers.Serializer):
    
    address_id = serializers.IntegerField()