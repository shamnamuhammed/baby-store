from django.http import Http404


def get_object(queryset, message="Object not found.", **kwargs):
    try:
        return queryset.get(**kwargs)
    except queryset.model.DoesNotExist:
        raise Http404(message)