import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NotificationService, type NotificationType } from '@/lib/services/notification-service';

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
    const type = searchParams.get('type') as NotificationType | null;

    const preferences = await NotificationService.getUserPreferences(session.user.id, type || undefined);

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Get notification preferences API error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, inAppEnabled, emailEnabled } = body;

    if (!type) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Notification type is required' } },
        { status: 400 }
      );
    }

    const validTypes: NotificationType[] = ['mention', 'quest_available', 'event_reminder', 'achievement', 'system'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Invalid notification type' } },
        { status: 400 }
      );
    }

    const success = await NotificationService.updateUserPreferences(session.user.id, type, {
      inAppEnabled,
      emailEnabled
    });

    if (!success) {
      return NextResponse.json(
        { error: { code: 'UPDATE_FAILED', message: 'Failed to update preferences' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update notification preferences API error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}