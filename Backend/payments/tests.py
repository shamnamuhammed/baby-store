from django.test import SimpleTestCase

from payments.models import Payment


class PaymentModelTests(SimpleTestCase):
    def test_payment_status_choices_include_expected_values(self):
        actual = {
            value for value, label in Payment.PaymentStatus.choices
        }

        self.assertEqual(
            actual,
            {
                "PENDING",
                "SUCCESS",
                "FAILED",
                "REFUND_REQUESTED",
                "REFUND_PROCESSING",
                "REFUND_FAILED",
                "REFUNDED",
            },
        )

    def test_default_status_is_pending(self):
        self.assertEqual(
            Payment._meta.get_field("status").default,
            Payment.PaymentStatus.PENDING,
        )

    def test_payment_method_choices(self):
        actual = {
            value for value, label in Payment.PaymentMethod.choices
        }

        self.assertEqual(
            actual,
            {"COD", "RAZORPAY", "STRIPE"},
        )

    def test_string_representation(self):
        payment = Payment(status=Payment.PaymentStatus.PENDING)

        self.assertEqual(str(payment), "Payment #None - PENDING")
