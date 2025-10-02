import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NotificationService } from '@/lib/services/notification-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const result = await NotificationService.getUserNotifications(session.user.id, {
      limit,
      offset,
      unreadOnly
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Only admins can create notifications via API
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, type, title, message, metadata } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    const notification = await NotificationService.createNotification({
      userId,
      type,
      title,
      message,
      metadata
    });

    if (!notification) {
      return NextResponse.json(
        { error: { code: 'CREATION_FAILED', message: 'Failed to create notification' } },
        { status: 500 }
      );
    }

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Create notification API error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}