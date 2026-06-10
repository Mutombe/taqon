"""Helpers for recording inventory audit-trail entries from the views."""
from .models import AuditLog


def diff(before: dict, instance, fields):
    """Return a {field: {from, to}} map of fields that changed.

    `before` is a snapshot of the instance's values taken before save.
    """
    changes = {}
    for f in fields:
        old = before.get(f)
        new = getattr(instance, f)
        if str(old) != str(new):
            changes[f] = {
                'from': None if old in (None, '') else str(old),
                'to': None if new in (None, '') else str(new),
            }
    return changes


def snapshot(instance, fields):
    return {f: getattr(instance, f) for f in fields}


def log(request, *, action, target_type, target_name, target_id='', summary='', changes=None):
    AuditLog.record(
        actor=getattr(request, 'user', None),
        action=action, target_type=target_type, target_name=target_name,
        target_id=target_id, summary=summary, changes=changes,
    )
