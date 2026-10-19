from django.test import SimpleTestCase

from orders.models import Order


class OrderModelTests(SimpleTestCase):
    def test_status_choices_include_expected_values(self):
        actual = {
            value for value, label in Order.OrderStatus.choices
        }

        self.assertEqual(
            actual,
            {
                "PENDING",
                "CONFIRMED",
                "SHIPPED",
                "DELIVERED",
                "CANCELLED",
            },
        )

    def test_default_status_is_pending(self):
        self.assertEqual(
            Order._meta.get_field("status").default,
            Order.OrderStatus.PENDING,
        )

    def test_string_representation(self):
        order = Order()

        self.assertEqual(str(order), "Order #None")
