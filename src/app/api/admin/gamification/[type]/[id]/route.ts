import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// PUT /api/admin/gamification/[type]/[id] - Update quest, badge, or title
export async function PUT(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { type, id } = params;
    const body = await request.json();

    if (!['quest', 'badge', 'title'].includes(type)) {
      return NextResponse.json(
        { error: { code: 'INVALID_TYPE', message: 'Invalid item type' } },
        { status: 400 }
      );
    }

    let result;
    let tableName = type === 'quest' ? 'quests' : type === 'badge' ? 'badges' : 'titles';

    if (type === 'quest') {
      const { title, description, xpReward, domain, requirements, isActive } = body;

      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramIndex}`);
        params.push(title);
        paramIndex++;
      }

      if (description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        params.push(description);
        paramIndex++;
      }

      if (xpReward !== undefined) {
        updates.push(`xp_reward = $${paramIndex}`);
        params.push(xpReward);
        paramIndex++;
      }

      if (domain !== undefined) {
        updates.push(`domain = $${paramIndex}`);
        params.push(domain);
        paramIndex++;
      }

      if (requirements !== undefined) {
        updates.push(`requirements = $${paramIndex}`);
        params.push(JSON.stringify(requirements));
        paramIndex++;
      }

      if (isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        params.push(isActive);
        paramIndex++;
      }

      if (updates.length === 0) {
        return NextResponse.json(
          { error: { code: 'NO_UPDATES', message: 'No valid updates provided' } },
          { status: 400 }
        );
      }

      updates.push(`updated_at = NOW()`);
      params.push(id);

      result = await db.query(`
        UPDATE quests 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, params);

    } else if (type === 'badge') {
      const { name, description, iconUrl, xpRequirement, domain, isActive } = body;

      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        params.push(name);
        paramIndex++;
      }

      if (description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        params.push(description);
        paramIndex++;
      }

      if (iconUrl !== undefined) {
        updates.push(`icon_url = $${paramIndex}`);
        params.push(iconUrl);
        paramIndex++;
      }

      if (xpRequirement !== undefined) {
        updates.push(`xp_requirement = $${paramIndex}`);
        params.push(xpRequirement);
        paramIndex++;
      }

      if (domain !== undefined) {
        updates.push(`domain = $${paramIndex}`);
        params.push(domain);
        paramIndex++;
      }

      if (isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        params.push(isActive);
        paramIndex++;
      }

      if (updates.length === 0) {
        return NextResponse.json(
          { error: { code: 'NO_UPDATES', message: 'No valid updates provided' } },
          { status: 400 }
        );
      }

      params.push(id);

      result = await db.query(`
        UPDATE badges 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, params);

    } else if (type === 'title') {
      const { name, description, xpRequirement, domain, isActive } = body;

      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        params.push(name);
        paramIndex++;
      }

      if (description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        params.push(description);
        paramIndex++;
      }

      if (xpRequirement !== undefined) {
        updates.push(`xp_requirement = $${paramIndex}`);
        params.push(xpRequirement);
        paramIndex++;
      }

      if (domain !== undefined) {
        updates.push(`domain = $${paramIndex}`);
        params.push(domain);
        paramIndex++;
      }

      if (isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        params.push(isActive);
        paramIndex++;
      }

      if (updates.length === 0) {
        return NextResponse.json(
          { error: { code: 'NO_UPDATES', message: 'No valid updates provided' } },
          { status: 400 }
        );
      }

      params.push(id);

      result = await db.query(`
        UPDATE titles 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, params);
    }

    if (result!.rows.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: `${type} not found` } },
        { status: 404 }
      );
    }

    // Log the admin action
    await db.query(`
      INSERT INTO moderation_actions (moderator_id, content_type, content_id, action, reason, notes)
      VALUES ($1, $2, $3, 'update', 'Admin gamification update', $4)
    `, [
      session.user.id,
      type,
      id,
      JSON.stringify({ updates: body, updatedBy: session.user.username })
    ]);

    return NextResponse.json({
      success: true,
      data: result!.rows[0],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin gamification update error:', error);
    return NextResponse.json(
      { 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to update gamification item' 
        } 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/gamification/[type]/[id] - Delete quest, badge, or title
export async function DELETE(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { type, id } = params;

    if (!['quest', 'badge', 'title'].includes(type)) {
      return NextResponse.json(
        { error: { code: 'INVALID_TYPE', message: 'Invalid item type' } },
        { status: 400 }
      );
    }

    let tableName = type === 'quest' ? 'quests' : type === 'badge' ? 'badges' : 'titles';

    // Check if item exists and get details for logging
    const checkQuery = `SELECT * FROM ${tableName} WHERE id = $1`;
    const checkResult = await db.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: `${type} not found` } },
        { status: 404 }
      );
    }

    const item = checkResult.rows[0];

    // Delete the item
    const deleteQuery = `DELETE FROM ${tableName} WHERE id = $1 RETURNING id`;
    const deleteResult = await db.query(deleteQuery, [id]);

    // Log the admin action
    await db.query(`
      INSERT INTO moderation_actions (moderator_id, content_type, content_id, action, reason, notes)
      VALUES ($1, $2, $3, 'delete', 'Admin gamification deletion', $4)
    `, [
      session.user.id,
      type,
      id,
      JSON.stringify({ 
        deletedItem: item, 
        deletedBy: session.user.username,
        deletedAt: new Date().toISOString()
      })
    ]);

    return NextResponse.json({
      success: true,
      data: { id, type, deleted: true },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin gamification deletion error:', error);
    return NextResponse.json(
      { 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to delete gamification item' 
        } 
      },
      { status: 500 }
    );
  }
}