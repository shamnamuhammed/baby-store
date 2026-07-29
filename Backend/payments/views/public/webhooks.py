import stripe

from django.conf import settings
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from payments.selectors.public.payment import get_payment_by_session_id
from payments.views.public.webhook_services import StripeWebhookService
stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeWebhookAPIView(APIView):

    authentication_classes = []
    permission_classes = []

    def post(self, request):

        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

        try:
            event = stripe.Webhook.construct_event(
                payload=payload,
                sig_header=sig_header,
                secret=settings.STRIPE_WEBHOOK_SECRET,
            )

        except ValueError:
            return Response(
                {"message": "Invalid payload."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except stripe.error.SignatureVerificationError:
            return Response(
                {"message": "Invalid signature."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if event["type"] == "checkout.session.completed":

            session = event["data"]["object"]
            try:
                payment = get_payment_by_session_id(
                    session["id"]
                )

                StripeWebhookService.payment_success(
                    payment=payment,
                    payment_intent=session["payment_intent"],
                )
            except Exception as e:
                import traceback
                traceback.print_exc()
                raise

        return Response(
                {"message": "Webhook received."},
            status=status.HTTP_200_OK,
        )