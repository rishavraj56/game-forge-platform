import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, canModerateContent } from '../../../../../lib/auth-middleware';
import { db } from '../../../../../lib/db';

// POST /api/community/moderation/bulk - Perform bulk moderation actions
export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { 
        action, // 'delete', 'restore', 'resolve_reports', 'dismiss_reports'
        items, // Array of {type: 'post'|'comment'|'report', id: string}
        reason,
        notes
      } = body;
      const user = req.user!;

      // Check if user has moderation permissions
      if (user.role !== 'admin' && user.role !== 'domain_lead') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions for moderation'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Validation
      if (!action || !items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Action and items array are required'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      if (items.length > 100) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Maximum 100 items allowed per bulk action'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      const validActions = ['delete', 'restore', 'resolve_reports', 'dismiss_reports'];
      if (!validActions.includes(action)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Invalid action. Must be one of: ${validActions.join(', ')}`
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Validate items structure
      for (const item of items) {
        if (!item.type || !item.id) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Each item must have type and id'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }

        const validTypes = action.includes('report') ? ['report'] : ['post', 'comment'];
        if (!validTypes.includes(item.type)) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: `Invalid item type for action ${action}. Expected: ${validTypes.join(', ')}`
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }
      }

      const results: {
        successful: Array<{ item: any; status: string }>;
        failed: Array<{ item: any; error: string }>;
        total: number;
      } = {
        successful: [],
        failed: [],
        total: items.length
      };

      // Begin transaction
      await db.query('BEGIN');

      try {
        for (const item of items) {
          try {
            if (action === 'delete' || action === 'restore') {
              // Handle content deletion/restoration
              const isDeleted = action === 'delete';
              
              // Verify content exists and check permissions
              let contentQuery = '';
              if (item.type === 'post') {
                contentQuery = `
                  SELECT p.id, p.is_deleted, ch.domain 
                  FROM posts p
                  JOIN channels ch ON p.channel_id = ch.id
                  WHERE p.id = $1
                `;
              } else if (item.type === 'comment') {
                contentQuery = `
                  SELECT c.id, c.is_deleted, ch.domain 
                  FROM comments c
                  JOIN posts p ON c.post_id = p.id
                  JOIN channels ch ON p.channel_id = ch.id
                  WHERE c.id = $1
                `;
              }

              const contentResult = await db.query(contentQuery, [item.id]);

              if (contentResult.rows.length === 0) {
                results.failed.push({
                  item,
                  error: 'Content not found'
                });
                continue;
              }

              const content = contentResult.rows[0];

              // Check domain permissions for domain leads
              if (user.role === 'domain_lead' && !canModerateContent(user.role, user.domain, content.domain)) {
                results.failed.push({
                  item,
                  error: 'Insufficient permissions for this domain'
                });
                continue;
              }

              // Perform the action
              const table = item.type === 'post' ? 'posts' : 'comments';
              
              await db.query(
                `UPDATE ${table} SET is_deleted = $1, updated_at = NOW() WHERE id = $2`,
                [isDeleted, item.id]
              );

              // Log the moderation action
              await db.query(
                `INSERT INTO moderation_actions (moderator_id, content_type, content_id, action, reason, notes)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [user.id, item.type, item.id, action, reason || null, notes || null]
              );

              results.successful.push({
                item,
                status: isDeleted ? 'deleted' : 'restored'
              });

            } else if (action === 'resolve_reports' || action === 'dismiss_reports') {
              // Handle report resolution/dismissal
              const reportResult = await db.query(
                `SELECT r.id, r.status, ch.domain
                 FROM reports r
                 LEFT JOIN posts p ON r.content_id = p.id AND r.content_type = 'post'
                 LEFT JOIN comments c ON r.content_id = c.id AND r.content_type = 'comment'
                 LEFT JOIN channels ch ON (p.channel_id = ch.id OR (c.post_id IN (SELECT id FROM posts WHERE channel_id = ch.id)))
                 WHERE r.id = $1`,
                [item.id]
              );

              if (reportResult.rows.length === 0) {
                results.failed.push({
                  item,
                  error: 'Report not found'
                });
                continue;
              }

              const report = reportResult.rows[0];

              // Check domain permissions for domain leads
              if (user.role === 'domain_lead' && !canModerateContent(user.role, user.domain, report.domain)) {
                results.failed.push({
                  item,
                  error: 'Insufficient permissions for this domain'
                });
                continue;
              }

              if (report.status !== 'pending') {
                results.failed.push({
                  item,
                  error: 'Report has already been processed'
                });
                continue;
              }

              // Update report status
              const newStatus = action === 'resolve_reports' ? 'resolved' : 'dismissed';
              await db.query(
                `UPDATE reports 
                 SET status = $1, resolved_by = $2, resolved_at = NOW(), resolution_notes = $3
                 WHERE id = $4`,
                [newStatus, user.id, notes || null, item.id]
              );

              results.successful.push({
                item,
                status: newStatus
              });
            }

          } catch (itemError) {
            console.error(`Error processing item ${item.id}:`, itemError);
            results.failed.push({
              item,
              error: 'Processing failed'
            });
          }
        }

        // Commit transaction
        await db.query('COMMIT');

        return NextResponse.json(
          {
            success: true,
            data: {
              action,
              results,
              summary: {
                total: results.total,
                successful: results.successful.length,
                failed: results.failed.length
              }
            },
            timestamp: new Date().toISOString()
          },
          { status: 200 }
        );

      } catch (error) {
        // Rollback transaction on error
        await db.query('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('Bulk moderation error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to perform bulk moderation action'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}