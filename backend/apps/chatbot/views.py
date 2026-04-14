from django.utils import timezone
from django.db.models import Q, Count, Avg
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from apps.core.permissions import IsAdmin
from apps.core.pagination import StandardPagination, SmallPagination
from .models import FAQ, SupportTicket, TicketMessage, ChatSession
from .serializers import (
    FAQSerializer, FAQPublicSerializer,
    SupportTicketListSerializer, SupportTicketDetailSerializer,
    TicketMessageSerializer, TicketMessageCreateSerializer,
    CreateTicketSerializer, TicketSatisfactionSerializer,
    ChatSessionSerializer, ChatMessageSerializer,
)


# ═══════════════════════════════════════════════════════════════════════
# PUBLIC — FAQ
# ═══════════════════════════════════════════════════════════════════════

class FAQListView(APIView):
    """Public: list published FAQs with optional category/search filter."""
    permission_classes = [AllowAny]

    def get(self, request):
        qs = FAQ.objects.filter(is_published=True)

        category = request.query_params.get('category')
        search = request.query_params.get('search')
        featured = request.query_params.get('featured')

        if category:
            qs = qs.filter(category=category)
        if featured:
            qs = qs.filter(is_featured=True)
        if search:
            qs = qs.filter(
                Q(question__icontains=search) |
                Q(answer__icontains=search) |
                Q(keywords__icontains=search)
            )

        serializer = FAQPublicSerializer(qs, many=True)
        return Response(serializer.data)


class FAQFeedbackView(APIView):
    """Public: mark an FAQ as helpful or not."""
    permission_classes = [AllowAny]

    def post(self, request, faq_id):
        try:
            faq = FAQ.objects.get(id=faq_id, is_published=True)
        except FAQ.DoesNotExist:
            return Response({'error': 'FAQ not found.'}, status=status.HTTP_404_NOT_FOUND)

        helpful = request.data.get('helpful', True)
        if helpful:
            faq.helpful_count += 1
        else:
            faq.not_helpful_count += 1
        faq.save(update_fields=['helpful_count', 'not_helpful_count'])

        return Response({'status': 'ok'})


class FAQCategoriesView(APIView):
    """Public: list FAQ categories with counts."""
    permission_classes = [AllowAny]

    def get(self, request):
        categories = (
            FAQ.objects.filter(is_published=True)
            .values('category')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        return Response(list(categories))


# ═══════════════════════════════════════════════════════════════════════
# CHATBOT — Server-side session
# ═══════════════════════════════════════════════════════════════════════

CHATBOT_RESPONSES = {
    'greeting': {
        'keywords': ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'howzit'],
        'reply': "Hello! Welcome to Taqon Electrico. I'm here to help you with solar and electrical enquiries. What would you like to know?",
        'suggestions': ['Pricing info', 'Installation timeline', 'Warranty details'],
    },
    'pricing': {
        'keywords': ['price', 'cost', 'how much', 'pricing', 'afford', 'budget', 'quote', 'quotation'],
        'reply': "Our solar systems start from $1,200 for basic home setups and go up to $12,000+ for commercial installations. Try our Calculator or request a free quote!",
        'suggestions': ['Open Calculator', 'Get a Quote', 'Financing options'],
    },
    'installation': {
        'keywords': ['install', 'installation', 'timeline', 'how long', 'duration', 'setup'],
        'reply': "A typical residential solar installation takes 1-3 days. Commercial installations may take 1-2 weeks. Our team handles everything from site survey to commissioning.",
        'suggestions': ['Get a Quote', 'View packages'],
    },
    'warranty': {
        'keywords': ['warranty', 'guarantee', 'lifespan', 'durability', 'quality'],
        'reply': "We use premium equipment: panels with 25-year warranties, batteries up to 5 years, inverters up to 5 years. Plus our installation workmanship warranty.",
        'suggestions': ['View products', 'Get a Quote'],
    },
    'financing': {
        'keywords': ['payment', 'financing', 'pay', 'installment', 'ecocash', 'innbucks', 'plan'],
        'reply': "We offer flexible payment plans: 6-month (0%), 12-month (5%), or 24-month (10%). We accept EcoCash, InnBucks, bank transfer, and cash.",
        'suggestions': ['Financing page', 'Payment calculator'],
    },
    'contact': {
        'keywords': ['contact', 'phone', 'call', 'email', 'address', 'location', 'where', 'office'],
        'reply': "Phone: +263 772 771 036\nEmail: info@taqon.co.zw\nOffice: 203 Sherwood Drive, Strathaven, Harare\nHours: Mon-Fri 08:00-16:30, Sat 08:00-13:00",
        'suggestions': ['WhatsApp us', 'Contact page'],
    },
    'products': {
        'keywords': ['panel', 'battery', 'inverter', 'product', 'equipment', 'brand'],
        'reply': "We supply Jinko & JA Solar panels, Pylontech & Dyness batteries, and Kodak & Deye inverters. Browse our full product range in our shop.",
        'suggestions': ['View shop', 'View packages'],
    },
    'services': {
        'keywords': ['service', 'offer', 'solutions', 'borehole', 'maintenance', 'electrical'],
        'reply': "We offer Solar Installations, Electrical Maintenance, Borehole Pump Installations, Lighting Solutions, and Solar System Maintenance across Zimbabwe.",
        'suggestions': ['Our solutions', 'Get a Quote'],
    },
    'support': {
        'keywords': ['support', 'help', 'ticket', 'problem', 'issue', 'complaint', 'broken', 'not working'],
        'reply': "I'm sorry you're having trouble. You can create a support ticket for personalised assistance from our team, or browse our FAQ for common solutions.",
        'suggestions': ['Create Ticket', 'View FAQ'],
    },
}

DEFAULT_RESPONSE = {
    'reply': "I appreciate your question! For more detailed assistance, speak with our team directly at +263 772 771 036 or chat on WhatsApp.",
    'suggestions': ['WhatsApp us', 'Contact page', 'Create Ticket'],
}


def get_chatbot_response(message):
    """Match user message to a response using keyword matching + FAQ lookup."""
    lower = message.lower().strip()

    # Check hardcoded responses first
    for data in CHATBOT_RESPONSES.values():
        if any(kw in lower for kw in data['keywords']):
            return data

    # Check FAQ database
    faqs = FAQ.objects.filter(is_published=True)
    for faq in faqs:
        keywords = faq.keywords or []
        if any(kw.lower() in lower for kw in keywords):
            return {
                'reply': f"**{faq.question}**\n\n{faq.answer}",
                'suggestions': ['More questions', 'Create Ticket'],
                'faq_id': str(faq.id),
            }
        if any(word in faq.question.lower() for word in lower.split() if len(word) > 3):
            return {
                'reply': f"**{faq.question}**\n\n{faq.answer}",
                'suggestions': ['More questions', 'Create Ticket'],
                'faq_id': str(faq.id),
            }

    return DEFAULT_RESPONSE


class ChatBotView(APIView):
    """Send a message to the chatbot and get a response."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ChatMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = serializer.validated_data['message']

        response = get_chatbot_response(message)

        # Persist to session if user is logged in
        if request.user.is_authenticated:
            session, _ = ChatSession.objects.get_or_create(
                user=request.user, is_active=True,
                defaults={'messages': []},
            )
            session.messages.append({'sender': 'user', 'text': message, 'ts': timezone.now().isoformat()})
            session.messages.append({'sender': 'bot', 'text': response['reply'], 'ts': timezone.now().isoformat()})
            session.save(update_fields=['messages', 'updated_at'])

        return Response({
            'reply': response['reply'],
            'suggestions': response.get('suggestions', []),
            'faq_id': response.get('faq_id'),
        })


class ChatHistoryView(APIView):
    """Get chat history for authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        session = ChatSession.objects.filter(
            user=request.user, is_active=True,
        ).first()
        if not session:
            return Response({'messages': []})
        return Response(ChatSessionSerializer(session).data)

    def delete(self, request):
        """Clear chat history."""
        ChatSession.objects.filter(user=request.user, is_active=True).update(
            is_active=False,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════════════════
# AUTHENTICATED — Customer Tickets
# ═══════════════════════════════════════════════════════════════════════

class CreateTicketView(APIView):
    """Create a new support ticket."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateTicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        ticket = SupportTicket.objects.create(
            customer=request.user,
            subject=data['subject'],
            category=data['category'],
            priority=data['priority'],
            order_id=data.get('order_id'),
            job_id=data.get('job_id'),
            created_by=request.user,
        )

        # Create the initial message
        TicketMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            sender_type='customer',
            content=data['message'],
        )

        return Response(
            SupportTicketDetailSerializer(ticket, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class MyTicketsView(APIView):
    """List current user's support tickets."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = SupportTicket.objects.filter(customer=request.user)

        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = SupportTicketListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class TicketDetailView(APIView):
    """Get a specific ticket with messages."""
    permission_classes = [IsAuthenticated]

    def get(self, request, ticket_number):
        try:
            ticket = SupportTicket.objects.prefetch_related(
                'messages__sender',
            ).get(ticket_number=ticket_number)
        except SupportTicket.DoesNotExist:
            return Response({'error': 'Ticket not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Customer can only see their own tickets
        if request.user.role not in ('admin', 'superadmin') and ticket.customer != request.user:
            return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        return Response(
            SupportTicketDetailSerializer(ticket, context={'request': request}).data,
        )


class TicketReplyView(APIView):
    """Customer or staff reply to a ticket."""
    permission_classes = [IsAuthenticated]

    def post(self, request, ticket_number):
        try:
            ticket = SupportTicket.objects.get(ticket_number=ticket_number)
        except SupportTicket.DoesNotExist:
            return Response({'error': 'Ticket not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Authorization
        is_staff = request.user.role in ('admin', 'superadmin')
        if not is_staff and ticket.customer != request.user:
            return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = TicketMessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        sender_type = 'staff' if is_staff else 'customer'
        is_internal = serializer.validated_data.get('is_internal', False) and is_staff

        message = TicketMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            sender_type=sender_type,
            content=serializer.validated_data['content'],
            is_internal=is_internal,
        )

        # Auto-update status based on who replied
        if sender_type == 'staff' and ticket.status == 'open':
            ticket.status = 'in_progress'
            ticket.save(update_fields=['status'])
        elif sender_type == 'staff' and ticket.status in ('open', 'waiting_staff'):
            ticket.status = 'waiting_customer'
            ticket.save(update_fields=['status'])
        elif sender_type == 'customer' and ticket.status == 'waiting_customer':
            ticket.status = 'waiting_staff'
            ticket.save(update_fields=['status'])

        return Response(
            TicketMessageSerializer(message).data,
            status=status.HTTP_201_CREATED,
        )


class TicketSatisfactionView(APIView):
    """Customer rates their ticket experience after resolution."""
    permission_classes = [IsAuthenticated]

    def post(self, request, ticket_number):
        try:
            ticket = SupportTicket.objects.get(
                ticket_number=ticket_number, customer=request.user,
            )
        except SupportTicket.DoesNotExist:
            return Response({'error': 'Ticket not found.'}, status=status.HTTP_404_NOT_FOUND)

        if ticket.status not in ('resolved', 'closed'):
            return Response(
                {'error': 'Can only rate resolved tickets.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = TicketSatisfactionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ticket.satisfaction_rating = serializer.validated_data['rating']
        ticket.satisfaction_comment = serializer.validated_data.get('comment', '')
        ticket.save(update_fields=['satisfaction_rating', 'satisfaction_comment'])

        return Response({'status': 'ok'})


# ═══════════════════════════════════════════════════════════════════════
# ADMIN — Ticket Management
# ═══════════════════════════════════════════════════════════════════════

class AdminTicketListView(APIView):
    """Admin: list all tickets with filters."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        qs = SupportTicket.objects.select_related('customer', 'assigned_to').all()

        status_filter = request.query_params.get('status')
        category = request.query_params.get('category')
        priority = request.query_params.get('priority')
        assigned = request.query_params.get('assigned_to')
        search = request.query_params.get('search')

        if status_filter:
            qs = qs.filter(status=status_filter)
        if category:
            qs = qs.filter(category=category)
        if priority:
            qs = qs.filter(priority=priority)
        if assigned == 'unassigned':
            qs = qs.filter(assigned_to__isnull=True)
        elif assigned:
            qs = qs.filter(assigned_to_id=assigned)
        if search:
            qs = qs.filter(
                Q(ticket_number__icontains=search) |
                Q(subject__icontains=search) |
                Q(customer__email__icontains=search)
            )

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = SupportTicketListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class AdminTicketDetailView(APIView):
    """Admin: get ticket detail."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, ticket_number):
        try:
            ticket = SupportTicket.objects.prefetch_related(
                'messages__sender',
            ).get(ticket_number=ticket_number)
        except SupportTicket.DoesNotExist:
            return Response({'error': 'Ticket not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(
            SupportTicketDetailSerializer(ticket, context={'request': request}).data,
        )


class AdminAssignTicketView(APIView):
    """Admin: assign a ticket to a staff member."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, ticket_number):
        try:
            ticket = SupportTicket.objects.get(ticket_number=ticket_number)
        except SupportTicket.DoesNotExist:
            return Response({'error': 'Ticket not found.'}, status=status.HTTP_404_NOT_FOUND)

        assigned_to = request.data.get('assigned_to')
        ticket.assigned_to_id = assigned_to
        if ticket.status == 'open':
            ticket.status = 'in_progress'
        ticket.save(update_fields=['assigned_to', 'status'])

        # System message
        TicketMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            sender_type='system',
            content=f'Ticket assigned to staff member.',
            is_internal=True,
        )

        return Response(SupportTicketListSerializer(ticket).data)


class AdminUpdateTicketStatusView(APIView):
    """Admin: update ticket status (resolve, close, reopen)."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, ticket_number):
        try:
            ticket = SupportTicket.objects.get(ticket_number=ticket_number)
        except SupportTicket.DoesNotExist:
            return Response({'error': 'Ticket not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        valid_statuses = [s[0] for s in SupportTicket.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Must be one of: {valid_statuses}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ticket.status = new_status
        update_fields = ['status']

        if new_status == 'resolved':
            ticket.resolved_at = timezone.now()
            ticket.resolved_by = request.user
            ticket.resolution_notes = request.data.get('resolution_notes', '')
            update_fields += ['resolved_at', 'resolved_by', 'resolution_notes']

        ticket.save(update_fields=update_fields)

        # System message
        TicketMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            sender_type='system',
            content=f'Ticket status changed to {new_status}.',
            is_internal=False,
        )

        return Response(SupportTicketListSerializer(ticket).data)


class AdminTicketStatsView(APIView):
    """Admin: support statistics."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        total = SupportTicket.objects.count()
        open_tickets = SupportTicket.objects.filter(status='open').count()
        in_progress = SupportTicket.objects.filter(status='in_progress').count()
        resolved = SupportTicket.objects.filter(status__in=['resolved', 'closed']).count()
        unassigned = SupportTicket.objects.filter(assigned_to__isnull=True).exclude(
            status__in=['resolved', 'closed'],
        ).count()

        avg_satisfaction = SupportTicket.objects.filter(
            satisfaction_rating__isnull=False,
        ).aggregate(avg=Avg('satisfaction_rating'))['avg'] or 0

        by_category = list(
            SupportTicket.objects.values('category')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )
        by_priority = list(
            SupportTicket.objects.exclude(status__in=['resolved', 'closed'])
            .values('priority')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        return Response({
            'total_tickets': total,
            'open_tickets': open_tickets,
            'in_progress': in_progress,
            'resolved': resolved,
            'unassigned': unassigned,
            'average_satisfaction': round(float(avg_satisfaction), 2),
            'by_category': by_category,
            'by_priority': by_priority,
        })


# ── Admin FAQ Management ───────────────────────────────────────────────

class AdminFAQListView(APIView):
    """Admin: list/create FAQs."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        qs = FAQ.objects.all()
        category = request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        serializer = FAQSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = FAQSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminFAQDetailView(APIView):
    """Admin: update/delete an FAQ."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, faq_id):
        try:
            faq = FAQ.objects.get(id=faq_id)
        except FAQ.DoesNotExist:
            return Response({'error': 'FAQ not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = FAQSerializer(faq, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, faq_id):
        try:
            faq = FAQ.objects.get(id=faq_id)
        except FAQ.DoesNotExist:
            return Response({'error': 'FAQ not found.'}, status=status.HTTP_404_NOT_FOUND)
        faq.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
