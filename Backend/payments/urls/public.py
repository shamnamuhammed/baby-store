from django.urls import path


from payments.views.public.webhooks import StripeWebhookAPIView


from payments.views.public import (
    CreatePaymentAPIView,
    PaymentListAPIView,
    PaymentDetailAPIView)
from payments.views.public.refund_payment import (
    RefundPaymentAPIView,
    
)




urlpatterns = [
    
    
    path(
        "create/",
        CreatePaymentAPIView.as_view(),
        name="create-payment",
    ),   
    path(
        "",
        PaymentListAPIView.as_view(),
        name="payment-list",
    ),
  
    path(
        "<int:pk>/",
        PaymentDetailAPIView.as_view(),
        name="payment-detail",
    ), 
    path(
        "webhook/",
        StripeWebhookAPIView.as_view(),
        name="stripe-webhook",
    ),
    path(
        "<int:pk>/refund/",
        RefundPaymentAPIView.as_view(),
        name="refund-payment",
    ),
   
]