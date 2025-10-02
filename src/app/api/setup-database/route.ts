import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Run Prisma migrations
    const { stdout, stderr } = await execAsync('npx prisma db push --skip-generate');
    
    console.log('Prisma migration output:', stdout);
    if (stderr) console.error('Prisma migration errors:', stderr);

    return NextResponse.json({
      success: true,
      message: 'Database setup complete! All tables created successfully.',
      output: stdout
    });

  } catch (error: any) {
    console.error('Database setup error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: 'Failed to set up database. Check logs for more information.',
      stderr: error.stderr
    }, { status: 500 });
  }
}
