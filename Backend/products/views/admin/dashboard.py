from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from core.response import success_response
from core.permission import IsAdmin
from products.selectors.dashboard import (
    get_dashboard_statistics,
    get_recent_orders,
    get_low_stock_products,
    get_featured_products,
    get_latest_users,
    get_monthly_revenue,
    get_monthly_orders,
    get_top_selling_products,
    get_order_status_chart,
)
from products.serializers.admin.dashboard import (
    AdminDashboardSerializer,
    RecentOrderSerializer,
    LowStockProductSerializer,
    FeaturedProductSerializer,
    LatestUserSerializer,
    MonthlyRevenueSerializer,
    MonthlyOrderSerializer,
    TopSellingProductSerializer,
    OrderStatusChartSerializer,
)


class AdminDashboardAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="Dashboard",
        description="Retrieve dashboard statistics.",
        tags=["Admin Dashboard"],
        responses={
            200: AdminDashboardSerializer,
        },
    )

    def get(self, request):

        statistics = get_dashboard_statistics()

        recent_orders = get_recent_orders()

        low_stock = get_low_stock_products()

        featured = get_featured_products()

        latest_users = get_latest_users()

        return success_response(
            message="Dashboard retrieved successfully.",
            data={
                "statistics": AdminDashboardSerializer(statistics).data,

                "recent_orders": RecentOrderSerializer(
                    recent_orders,
                    many=True,
                ).data,

                "low_stock_products": LowStockProductSerializer(
                    low_stock,
                    many=True,
                ).data,

                "featured_products": FeaturedProductSerializer(
                    featured,
                    many=True,
                ).data,

                "latest_users": LatestUserSerializer(
                    latest_users,
                    many=True,
                ).data,
                
                "monthly_revenue": MonthlyRevenueSerializer(
                    get_monthly_revenue(),
                    many=True,
                ).data,

                "monthly_orders": MonthlyOrderSerializer(
                    get_monthly_orders(),
                    many=True,
                ).data,

                "top_selling_products": TopSellingProductSerializer(
                    get_top_selling_products(),
                    many=True,
                ).data,

                "order_status_chart": OrderStatusChartSerializer(
                    get_order_status_chart(),
                    many=True,
                ).data,
            },
        )