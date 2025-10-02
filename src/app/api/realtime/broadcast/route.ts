import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { channel, event, payload } = body;

    // Validate required fields
    if (!channel || !event || !payload) {
      return NextResponse.json(
        { 
          error: { 
            code: 'INVALID_REQUEST', 
            message: 'Channel, event, and payload are required' 
          } 
        },
        { status: 400 }
      );
    }

    // Broadcast the event using Supabase
    const { error } = await supabaseAdmin
      .channel(channel)
      .send({
        type: 'broadcast',
        event,
        payload: {
          ...payload,
          timestamp: new Date().toISOString(),
          broadcastBy: session.user.id
        }
      });

    if (error) {
      console.error('Supabase broadcast error:', error);
      return NextResponse.json(
        { 
          error: { 
            code: 'BROADCAST_FAILED', 
            message: 'Failed to broadcast event' 
          } 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Broadcast API error:', error);
    return NextResponse.json(
      { 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Internal server error' 
        } 
      },
      { status: 500 }
    );
  }
}

// Helper function to broadcast activity events
export async function broadcastActivity(activity: {
  userId: string;
  username: string;
  type: string;
  description: string;
  metadata?: Record<string, any>;
}) {
  try {
    const { error } = await supabaseAdmin
      .channel('activity-feed')
      .send({
        type: 'broadcast',
        event: 'activity',
        payload: {
          id: `${activity.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...activity,
          timestamp: new Date().toISOString()
        }
      });

    if (error) {
      console.error('Failed to broadcast activity:', error);
    }
  } catch (error) {
    console.error('Activity broadcast error:', error);
  }
}

// Helper function to broadcast leaderboard updates
export async function broadcastLeaderboardUpdate(update: {
  userId: string;
  username: string;
  domain: string;
  oldPosition?: number;
  newPosition: number;
  xp: number;
  type: 'weekly' | 'all_time';
}) {
  try {
    const { error } = await supabaseAdmin
      .channel('leaderboard-updates')
      .send({
        type: 'broadcast',
        event: 'leaderboard_update',
        payload: update
      });

    if (error) {
      console.error('Failed to broadcast leaderboard update:', error);
    }
  } catch (error) {
    console.error('Leaderboard broadcast error:', error);
  }
}