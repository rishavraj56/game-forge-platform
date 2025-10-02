import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../../lib/auth-middleware';
import { db } from '../../../../../lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/users/[id]/avatar - Upload profile avatar
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = params;

      // Users can update their own avatar, admins can update any avatar
      if (req.user!.id !== id && req.user!.role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied to update this user avatar'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      const formData = await req.formData();
      const file = formData.get('avatar') as File;

      if (!file) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NO_FILE',
              message: 'No avatar file provided'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_FILE_TYPE',
              message: 'Avatar must be a JPEG, PNG, WebP, or GIF image'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FILE_TOO_LARGE',
              message: 'Avatar file must be smaller than 5MB'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // For now, we'll simulate file upload and return a mock URL
      // In a real implementation, you would upload to a service like:
      // - Vercel Blob Storage
      // - AWS S3
      // - Cloudinary
      // - Supabase Storage
      
      const fileExtension = file.name.split('.').pop();
      const fileName = `avatar_${id}_${Date.now()}.${fileExtension}`;
      
      // Mock upload - in production, replace with actual upload logic
      const mockAvatarUrl = `/api/uploads/avatars/${fileName}`;
      
      // TODO: Implement actual file upload
      // const uploadResult = await uploadToStorage(file, fileName);
      // const avatarUrl = uploadResult.url;

      // Update user avatar URL in database
      const result = await db`
        UPDATE users 
        SET avatar_url = ${mockAvatarUrl}, updated_at = NOW()
        WHERE id = ${id} AND is_active = true
        RETURNING id, username, avatar_url, updated_at
      `;

      if (result.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            user: result.rows[0],
            message: 'Avatar uploaded successfully'
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Avatar upload error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to upload avatar'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/users/[id]/avatar - Remove profile avatar
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = params;

      // Users can remove their own avatar, admins can remove any avatar
      if (req.user!.id !== id && req.user!.role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied to remove this user avatar'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Remove avatar URL from database
      const result = await db`
        UPDATE users 
        SET avatar_url = NULL, updated_at = NOW()
        WHERE id = ${id} AND is_active = true
        RETURNING id, username, avatar_url, updated_at
      `;

      if (result.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // TODO: In production, also delete the file from storage
      // await deleteFromStorage(previousAvatarUrl);

      return NextResponse.json(
        {
          success: true,
          data: {
            user: result.rows[0],
            message: 'Avatar removed successfully'
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Avatar removal error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to remove avatar'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}