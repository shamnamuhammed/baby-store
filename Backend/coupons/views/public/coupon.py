from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from drf_spectacular.utils import extend_schema

from core.response import success_response
from rest_framework.response import Response

from coupons.serializers.public import ApplyCouponSerializer
from coupons.selectors.public.coupon import get_coupon_by_code
from coupons.services.public.coupon import apply_coupon

from orders.selectors.public import get_pending_order_by_id
from coupons.services.public import remove_coupon

class ApplyCouponAPIView(APIView):

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Coupons"],
        request=ApplyCouponSerializer,
    )
    def post(self, request):
        print("===== APPLY COUPON API HIT =====")

        serializer = ApplyCouponSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        order = get_pending_order_by_id(
            order_id=request.data["order_id"],
            user=request.user,
        )

        coupon = get_coupon_by_code(
            code=serializer.validated_data["code"],
        )

        result = apply_coupon(
            coupon=coupon,
            order=order,
            user=request.user,
        )

        return success_response(
            message="Coupon applied successfully.",
            data={
                "coupon": coupon.code,
                "discount": result["discount"],
                "final_total": result["final_total"],
            },
        )


class RemoveCouponAPIView(APIView):

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Coupons"],
    )
    def delete(self, request, order_id):

        order = get_pending_order_by_id(
            order_id=order_id,
            user=request.user,
        )

        remove_coupon(
            order=order,
        )

        return success_response(
            message="Coupon removed successfully.",
        )