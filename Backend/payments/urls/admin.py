from django.urls import path
from payments.views.admin.payment import (
    AdminPaymentListAPIView,
    AdminPaymentDetailAPIView,
)
from payments.views.admin.refund import (
    AdminRefundListAPIView,
    AdminRefundDetailAPIView,
    ApproveRefundAPIView,
    RejectRefundAPIView,
)

urlpatterns = [
    
    # Payments
    path(
        "",
        AdminPaymentListAPIView.as_view(),
        name="admin-payment-list",
    ),

    path(
        "<int:pk>/",
        AdminPaymentDetailAPIView.as_view(),
        name="admin-payment-detail",
    ),

    path(
        "refunds/",
        AdminRefundListAPIView.as_view(),
        name="admin-refund-list",
    ),

    path(
        "refunds/<int:pk>/",
        AdminRefundDetailAPIView.as_view(),
        name="admin-refund-detail",
    ),

    path(
        "refunds/<int:pk>/approve/",
        ApproveRefundAPIView.as_view(),
        name="admin-refund-approve",
    ),

    path(
        "refunds/<int:pk>/reject/",
        RejectRefundAPIView.as_view(),
        name="admin-refund-reject",
    ),
]