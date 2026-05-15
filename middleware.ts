import { NextResponse, type NextRequest } from "next/server";

const REALM = "Windmar Admin";

export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_USERNAME ?? "ADMIN";
  const pass = process.env.ADMIN_PASSWORD ?? "";

  if (!pass) {
    return new NextResponse("ADMIN_PASSWORD env var not configured", { status: 500 });
  }

  const header = req.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme === "Basic" && token) {
    try {
      const decoded = atob(token);
      const sep = decoded.indexOf(":");
      const u = decoded.slice(0, sep);
      const p = decoded.slice(sep + 1);
      if (u === user && p === pass) {
        return NextResponse.next();
      }
    } catch {
      // fallthrough
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
    },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/refresh/:path*"],
};
