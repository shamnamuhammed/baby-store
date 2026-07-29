from decimal import Decimal


def calculate_discount(*, offer, price):
    """
    Calculate the discount amount for an offer.
    """

    if not offer:
        return Decimal("0.00")

    if offer.discount_type == offer.DiscountType.FIXED:
        return min(
            offer.discount_value,
            price,
        )

    discount = (
        price * offer.discount_value
    ) / Decimal("100")

    if offer.maximum_discount:
        discount = min(
            discount,
            offer.maximum_discount,
        )

    return discount


def calculate_final_price(*, price, discount):
    """
    Calculate the final price after discount.
    """

    final_price = price - discount

    if final_price < Decimal("0.00"):
        return Decimal("0.00")

    return final_price


def get_best_discount(*, product, product_offer=None, category_offer=None):
    """
    Compare product offer and category offer and
    return the one that gives the highest discount.
    """

    product_discount = calculate_discount(
        offer=product_offer,
        price=product.price,
    )

    category_discount = calculate_discount(
        offer=category_offer,
        price=product.price,
    )

    if product_discount >= category_discount:
        return {
            "offer": product_offer,
            "discount": product_discount,
            "final_price": calculate_final_price(
                price=product.price,
                discount=product_discount,
            ),
        }

    return {
        "offer": category_offer,
        "discount": category_discount,
        "final_price": calculate_final_price(
            price=product.price,
            discount=category_discount,
        ),
    }