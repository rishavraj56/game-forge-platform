import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../lib/auth-middleware';
import { db } from '../../../lib/db';
import { Domain } from '../../../lib/types';

// GET /api/domains - Get all domains with statistics
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const includeStats = searchParams.get('includeStats') === 'true';
      const includeLeads = searchParams.get('includeLeads') === 'true';

      const domains: Domain[] = [
        'Game Development',
        'Game Design', 
        'Game Art',
        'AI for Game Development',
        'Creative',
        'Corporate'
      ];

      if (!includeStats && !includeLeads) {
        // Simple domain list
        return NextResponse.json(
          {
            success: true,
            data: domains.map(domain => ({ name: domain })),
            timestamp: new Date().toISOString()
          },
          { status: 200 }
        );
      }

      // Get detailed domain information
      const domainData = await Promise.all(
        domains.map(async (domain) => {
          const domainInfo: any = { name: domain };

          if (includeStats) {
            // Get domain statistics
            const statsResult = await db`
              SELECT 
                COUNT(DISTINCT CASE WHEN u.is_active = true THEN u.id END) as total_members,
                COUNT(DISTINCT CASE WHEN u.role = 'domain_lead' AND u.is_active = true THEN u.id END) as domain_leads,
                COUNT(DISTINCT CASE WHEN c.is_active = true THEN c.id END) as channels,
                COUNT(DISTINCT CASE WHEN lm.is_published = true THEN lm.id END) as learning_modules,
                COUNT(DISTINCT CASE WHEN e.is_active = true AND e.start_date > NOW() THEN e.id END) as upcoming_events,
                AVG(CASE WHEN u.is_active = true THEN u.xp END) as avg_xp,
                MAX(CASE WHEN u.is_active = true THEN u.xp END) as max_xp
              FROM (SELECT ${domain} as domain_name) d
              LEFT JOIN users u ON u.domain = d.domain_name
              LEFT JOIN channels c ON c.domain = d.domain_name
              LEFT JOIN learning_modules lm ON lm.domain = d.domain_name
              LEFT JOIN events e ON e.domain = d.domain_name
            `;

            const stats = statsResult.rows[0];
            domainInfo.stats = {
              total_members: parseInt(stats.total_members) || 0,
              domain_leads: parseInt(stats.domain_leads) || 0,
              channels: parseInt(stats.channels) || 0,
              learning_modules: parseInt(stats.learning_modules) || 0,
              upcoming_events: parseInt(stats.upcoming_events) || 0,
              avg_xp: Math.round(parseFloat(stats.avg_xp) || 0),
              max_xp: parseInt(stats.max_xp) || 0
            };
          }

          if (includeLeads) {
            // Get domain leads
            const leadsResult = await db`
              SELECT id, username, avatar_url, xp, level, created_at
              FROM users 
              WHERE domain = ${domain} AND role = 'domain_lead' AND is_active = true
              ORDER BY xp DESC
            `;

            domainInfo.leads = leadsResult.rows.map(lead => ({
              id: lead.id,
              username: lead.username,
              avatar_url: lead.avatar_url,
              xp: lead.xp,
              level: lead.level,
              created_at: lead.created_at
            }));
          }

          return domainInfo;
        })
      );

      return NextResponse.json(
        {
          success: true,
          data: domainData,
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get domains error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch domains'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}