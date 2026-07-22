import django_filters

from products.models import Product


class ProductFilter(django_filters.FilterSet):
    
    brand = django_filters.NumberFilter(
        field_name="brand__id",
    )
    
    min_price = django_filters.NumberFilter(
        field_name="price",
        lookup_expr="gte",
    )

    max_price = django_filters.NumberFilter(
        field_name="price",
        lookup_expr="lte",
    )

    category = django_filters.NumberFilter(
        field_name="category__id",
    )

    is_active = django_filters.BooleanFilter(
        field_name="is_active",
    )

    class Meta:

        model = Product

        fields = [
            "category",
            "brand",
            "is_active",
        ]