export async function GET() {
  return Response.json({
    success: true,
    message: "Recipients API is available.",
  });
}