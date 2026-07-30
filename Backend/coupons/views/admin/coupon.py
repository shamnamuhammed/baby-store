from drf_spectacular.utils import extend_schema

from rest_framework.views import APIView

from core.permission import IsAdmin
from core.pagination import CustomPagination
from core.response import success_response

from coupons.selectors.admin.coupon import (
    get_all_coupons,
    get_coupon_by_id,
)

from coupons.serializers.admin import (
    CouponSerializer,
    CreateCouponSerializer,
    UpdateCouponSerializer,
)

from coupons.services.admin import (
    create_coupon,
    update_coupon,
    delete_coupon,
    activate_coupon,
    deactivate_coupon,
)


class AdminCouponListAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        tags=["Admin Coupons"],
        responses=CouponSerializer(many=True),
    )
    def get(self, request):

        coupons = get_all_coupons()

        paginator = CustomPagination()

        page = paginator.paginate_queryset(
            coupons,
            request,
        )

        serializer = CouponSerializer(
            page,
            many=True,
        )

        return paginator.get_paginated_response(
            serializer.data,
        )

    @extend_schema(
        tags=["Admin Coupons"],
        request=CreateCouponSerializer,
        responses=CouponSerializer,
    )
    def post(self, request):

        serializer = CreateCouponSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        coupon = create_coupon(
            data=serializer.validated_data,
        )

        return success_response(
            message="Coupon created successfully.",
            data=CouponSerializer(coupon).data,
        )
        
class AdminCouponDetailAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        tags=["Admin Coupons"],
        responses=CouponSerializer,
    )
    def get(self, request, pk):

        coupon = get_coupon_by_id(
            coupon_id=pk,
        )

        return success_response(
            message="Coupon retrieved successfully.",
            data=CouponSerializer(coupon).data,
        )

    @extend_schema(
        tags=["Admin Coupons"],
        request=UpdateCouponSerializer,
        responses=CouponSerializer,
    )
    def patch(self, request, pk):

        coupon = get_coupon_by_id(
            coupon_id=pk,
        )

        serializer = UpdateCouponSerializer(
            coupon,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        coupon = update_coupon(
            coupon=coupon,
            data=serializer.validated_data,
        )

        return success_response(
            message="Coupon updated successfully.",
            data=CouponSerializer(coupon).data,
        )

    @extend_schema(
        tags=["Admin Coupons"],
    )
    def delete(self, request, pk):

        coupon = get_coupon_by_id(
            coupon_id=pk,
        )

        delete_coupon(
            coupon=coupon,
        )

        return success_response(
            message="Coupon deleted successfully.",
        )
        
class ActivateCouponAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        tags=["Admin Coupons"],
        responses=CouponSerializer,
    )
    def patch(self, request, pk):

        coupon = get_coupon_by_id(
            coupon_id=pk,
        )

        coupon = activate_coupon(
            coupon=coupon,
        )

        return success_response(
            message="Coupon activated successfully.",
            data=CouponSerializer(coupon).data,
        )
        
        
class DeactivateCouponAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        tags=["Admin Coupons"],
        responses=CouponSerializer,
    )
    def patch(self, request, pk):

        coupon = get_coupon_by_id(
            coupon_id=pk,
        )

        coupon = deactivate_coupon(
            coupon=coupon,
        )

        return success_response(
            message="Coupon deactivated successfully.",
            data=CouponSerializer(coupon).data,
        )