from rest_framework import serializers
from rest_framework import serializers
from orders.models import Order
from products.models import Product
from users.models import User



class AdminDashboardSerializer(serializers.Serializer):

    total_products = serializers.IntegerField()

    active_products = serializers.IntegerField()

    inactive_products = serializers.IntegerField()

    total_categories = serializers.IntegerField()

    total_brands = serializers.IntegerField()

    total_users = serializers.IntegerField()

    total_orders = serializers.IntegerField()

    pending_orders = serializers.IntegerField()

    confirmed_orders = serializers.IntegerField()

    shipped_orders = serializers.IntegerField()

    delivered_orders = serializers.IntegerField()

    cancelled_orders = serializers.IntegerField()

    total_revenue = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )
    
    
    
class RecentOrderSerializer(serializers.ModelSerializer):

    customer = serializers.CharField(
        source="user.username",
    )

    class Meta:

        model = Order

        fields = (
            "id",
            "customer",
            "status",
            "total_amount",
            "created_at",
        )
        
        
class LowStockProductSerializer(serializers.ModelSerializer):

    class Meta:

        model = Product

        fields = (
            "id",
            "name",
            "sku",
            "stock_quantity",
            "price",
        )
        
        
class FeaturedProductSerializer(serializers.ModelSerializer):

    class Meta:

        model = Product

        fields = (
            "id",
            "name",
            "price",
            "stock_quantity",
        )
        
        
class LatestUserSerializer(serializers.ModelSerializer):

    class Meta:

        model = User

        fields = (
            "id",
            "username",
            "email",
            "date_joined",
        )
        
class MonthlyRevenueSerializer(serializers.Serializer):

    month = serializers.DateField()

    revenue = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )
    
class MonthlyOrderSerializer(serializers.Serializer):

    month = serializers.DateField()

    total_orders = serializers.IntegerField()
    

class TopSellingProductSerializer(serializers.Serializer):

    product__id = serializers.IntegerField()

    product__name = serializers.CharField()

    sold = serializers.IntegerField()
    
    
class OrderStatusChartSerializer(serializers.Serializer):

    status = serializers.CharField()

    count = serializers.IntegerField()