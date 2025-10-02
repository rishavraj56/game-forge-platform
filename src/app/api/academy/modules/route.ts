import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withDomainLead, AuthenticatedRequest } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/db';
import { LearningModule, Domain, Difficulty } from '../../../../lib/types';

// GET /api/academy/modules - Get all learning modules (with optional filtering)
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const domain = searchParams.get('domain') as Domain | null;
      const difficulty = searchParams.get('difficulty') as Difficulty | null;
      const published = searchParams.get('published');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      const offset = (page - 1) * limit;

      // Build query conditions
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (domain) {
        conditions.push(`lm.domain = $${paramIndex}`);
        params.push(domain);
        paramIndex++;
      }

      if (difficulty) {
        conditions.push(`lm.difficulty = $${paramIndex}`);
        params.push(difficulty);
        paramIndex++;
      }

      if (published !== null) {
        conditions.push(`lm.is_published = $${paramIndex}`);
        params.push(published === 'true');
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get modules with user progress
      const modulesResult = await db.query(`
        SELECT 
          lm.id,
          lm.title,
          lm.description,
          lm.domain,
          lm.difficulty,
          lm.xp_reward,
          lm.content,
          lm.prerequisites,
          lm.estimated_duration,
          lm.is_published,
          lm.created_by,
          lm.created_at,
          lm.updated_at,
          u.username as creator_username,
          COALESCE(ump.completed, false) as user_completed,
          COALESCE(ump.progress, 0) as user_progress,
          ump.started_at as user_started_at,
          ump.completed_at as user_completed_at,
          ump.last_accessed as user_last_accessed
        FROM learning_modules lm
        LEFT JOIN users u ON lm.created_by = u.id
        LEFT JOIN user_module_progress ump ON lm.id = ump.module_id AND ump.user_id = $${paramIndex}
        ${whereClause}
        ORDER BY lm.created_at DESC
        LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
      `, [...params, req.user!.id, limit, offset]);

      // Get total count for pagination
      const countResult = await db.query(`
        SELECT COUNT(*) as total
        FROM learning_modules lm
        ${whereClause}
      `, params);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return NextResponse.json(
        {
          success: true,
          data: {
            modules: modulesResult.rows,
            pagination: {
              page,
              limit,
              total,
              totalPages,
              hasNext: page < totalPages,
              hasPrev: page > 1
            }
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get learning modules error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch learning modules'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/academy/modules - Create new learning module (domain leads and admins only)
export async function POST(request: NextRequest) {
  return withDomainLead(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { 
        title, 
        description, 
        domain, 
        difficulty, 
        xp_reward, 
        content, 
        prerequisites, 
        estimated_duration,
        is_published 
      } = body;

      // Validate required fields
      if (!title || !description || !domain || !difficulty || !xp_reward || !content) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MISSING_FIELDS',
              message: 'Title, description, domain, difficulty, xp_reward, and content are required'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Validate domain
      const validDomains = ['Game Development', 'Game Design', 'Game Art', 'AI for Game Development', 'Creative', 'Corporate'];
      if (!validDomains.includes(domain)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_DOMAIN',
              message: 'Invalid domain specified'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Validate difficulty
      if (!['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_DIFFICULTY',
              message: 'Difficulty must be beginner, intermediate, or advanced'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Validate XP reward
      if (typeof xp_reward !== 'number' || xp_reward < 1 || xp_reward > 5000) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_XP_REWARD',
              message: 'XP reward must be a number between 1 and 5000'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Validate content array
      if (!Array.isArray(content) || content.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_CONTENT',
              message: 'Content must be a non-empty array'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Check if user can create modules for this domain
      if (req.user!.role !== 'admin' && req.user!.domain !== domain) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only create modules for your own domain'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Create learning module
      const result = await db`
        INSERT INTO learning_modules (
          title, 
          description, 
          domain, 
          difficulty, 
          xp_reward, 
          content, 
          prerequisites, 
          estimated_duration,
          is_published,
          created_by
        )
        VALUES (
          ${title}, 
          ${description}, 
          ${domain}, 
          ${difficulty}, 
          ${xp_reward}, 
          ${JSON.stringify(content)}, 
          ${JSON.stringify(prerequisites || [])}, 
          ${estimated_duration || null},
          ${is_published || false},
          ${req.user!.id}
        )
        RETURNING *
      `;

      return NextResponse.json(
        {
          success: true,
          data: { module: result.rows[0] },
          timestamp: new Date().toISOString()
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('Create learning module error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create learning module'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}