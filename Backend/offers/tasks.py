from django.utils import timezone
from celery import shared_task
from offers.models import Offer

@shared_task
def update_offer_status():
    """
    Automatically activate and deactivate offers
    based on start_date and end_date.
    """

    now = timezone.now()

    # Activate scheduled offers
    Offer.objects.filter(
        start_date__lte=now,
        end_date__gte=now,
        
    ).update(
        is_active=True,
    )

    # Deactivate expired offers
    Offer.objects.filter(
        end_date__lt=now,
    ).update(
        is_active=False,
    )
    
     # Keep future offers inactive
    Offer.objects.filter(
        start_date__gt=now,
    ).update(
        is_active=False,
    )