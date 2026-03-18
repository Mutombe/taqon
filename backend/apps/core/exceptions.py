from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """
    Custom exception handler returning consistent error format:
    {"error": "message", "code": "ERROR_CODE", "status_code": 400, "details": {}}
    """
    response = exception_handler(exc, context)

    if response is not None:
        detail = getattr(exc, 'detail', str(exc))
        code = getattr(exc, 'default_code', 'error')

        custom_response = {
            'error': '',
            'code': code,
            'status_code': response.status_code,
        }

        if isinstance(detail, dict):
            custom_response['error'] = 'Validation failed'
            custom_response['details'] = detail
        elif isinstance(detail, list):
            custom_response['error'] = str(detail[0]) if detail else 'Error'
            custom_response['details'] = detail
        else:
            custom_response['error'] = str(detail)

        response.data = custom_response

    return response
