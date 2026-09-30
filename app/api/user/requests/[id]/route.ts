import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/jwt";
import { RequestService } from "@/services/request.service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await requireUser(req);
    const request = await RequestService.getRequestById(params.id, sessionUser.id);

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ request });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
