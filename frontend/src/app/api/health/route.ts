/**
 * Health Check API Route
 * For Docker health checks
 */

export async function GET() {
  return Response.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'frontend',
    },
    { status: 200 }
  );
}



