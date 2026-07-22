from django.db.models import Sum
from products.models import Product, Category, Brand
from users.models import User
from orders.models import Order
from django.db.models.functions import TruncMonth
from django.db.models import Count
from orders.models import OrderItem

def get_dashboard_statistics():

    return {

        "total_products":
            Product.objects.count(),

        "active_products":
            Product.objects.filter(
                is_active=True
            ).count(),

        "inactive_products":
            Product.objects.filter(
                is_active=False
            ).count(),

        "total_categories":
            Category.objects.count(),

        "total_brands":
            Brand.objects.count(),

        "total_users":
            User.objects.count(),

        "total_orders":
            Order.objects.count(),

        "pending_orders":
            Order.objects.filter(
                status="pending"
            ).count(),

        "confirmed_orders":
            Order.objects.filter(
                status="confirmed"
            ).count(),

        "shipped_orders":
            Order.objects.filter(
                status="shipped"
            ).count(),

        "delivered_orders":
            Order.objects.filter(
                status="delivered"
            ).count(),

        "cancelled_orders":
            Order.objects.filter(
                status="cancelled"
            ).count(),

        "total_revenue":
            Order.objects.filter(
                status="delivered"
            ).aggregate(
                total=Sum("total_amount")
            )["total"] or 0,
    }
    
    
def get_recent_orders():

    return (
        Order.objects
        .select_related("user")
        .order_by("-created_at")[:5]
    )
    


def get_low_stock_products():

    return (
        Product.objects
        .filter(
            stock_quantity__lte=5,
            is_active=True,
        )
        .select_related(
            "category",
            "brand",
        )
        .order_by("stock_quantity")[:5]
    )
    
    
def get_featured_products():

    return (
        Product.objects
        .filter(
            is_featured=True,
            is_active=True,
        )
        .select_related(
            "category",
            "brand",
        )[:5]
    )
    
    

def get_latest_users():

    return (
        User.objects
        .order_by("-date_joined")[:5]
    )
    
def get_monthly_revenue():

    return (
        Order.objects
        .filter(
            status=Order.OrderStatus.DELIVERED,
        )
        .annotate(
            month=TruncMonth("created_at"),
        )
        .values("month")
        .annotate(
            revenue=Sum("total_amount"),
        )
        .order_by("month")
    )
    
def get_monthly_orders():

    return (
        Order.objects
        .annotate(
            month=TruncMonth("created_at"),
        )
        .values("month")
        .annotate(
            total_orders=Count("id"),
        )
        .order_by("month")
    )
    
def get_top_selling_products():

    return (
        OrderItem.objects
        .values(
            "product__id",
            "product__name",
        )
        .annotate(
            sold=Sum("quantity"),
        )
        .order_by("-sold")[:5]
    )
    
    
def get_order_status_chart():

    return (
        Order.objects
        .values("status")
        .annotate(
            count=Count("id"),
        )
        .order_by("status")
    )