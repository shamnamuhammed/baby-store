from rest_framework.views import APIView
from rest_framework import status

from drf_spectacular.utils import extend_schema

from core.permission import IsAdmin
from core.pagination import CustomPagination
from core.response import success_response

from payments.selectors.admin.refund import (
    get_admin_refunds,
    get_admin_refund_by_id,
)

from payments.serializers.admin.refund import (
    AdminRefundSerializer,
)

from payments.services.admin.refund import (
    approve_refund,
    reject_refund,
)


class AdminRefundListAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        tags=["Admin Refunds"],
        responses=AdminRefundSerializer(many=True),
    )
    def get(self, request):

        refunds = get_admin_refunds(request)

        paginator = CustomPagination()

        page = paginator.paginate_queryset(
            refunds,
            request,
        )

        serializer = AdminRefundSerializer(
            page,
            many=True,
        )

        return paginator.get_paginated_response(
            serializer.data,
        )


class AdminRefundDetailAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        tags=["Admin Refunds"],
        responses=AdminRefundSerializer,
    )
    def get(self, request, pk):

        payment = get_admin_refund_by_id(
            payment_id=pk,
        )

        return success_response(
            message="Refund retrieved successfully.",
            data=AdminRefundSerializer(payment).data,
        )


class ApproveRefundAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        tags=["Admin Refunds"],
        responses=AdminRefundSerializer,
    )
    def patch(self, request, pk):

        payment = get_admin_refund_by_id(
            payment_id=pk,
        )

        payment = approve_refund(
            payment=payment,
        )

        return success_response(
            message="Refund approved successfully.",
            data=AdminRefundSerializer(payment).data,
        )


class RejectRefundAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        tags=["Admin Refunds"],
        responses=AdminRefundSerializer,
    )
    def patch(self, request, pk):

        payment = get_admin_refund_by_id(
            payment_id=pk,
        )

        payment = reject_refund(
            payment=payment,
        )

        return success_response(
            message="Refund rejected successfully.",
            data=AdminRefundSerializer(payment).data,
        )