import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function unauthorizedResponse() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Subtracker", charset="UTF-8"'
    }
  });
}

export function middleware(request: NextRequest) {
  const username = process.env.BASIC_AUTH_USERNAME;
  const password = process.env.BASIC_AUTH_PASSWORD;

  if (!username || !password) {
    return NextResponse.next();
  }

  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return unauthorizedResponse();
  }

  const [scheme, encoded] = authorization.split(" ");
  if (scheme !== "Basic" || !encoded) {
    return unauthorizedResponse();
  }

  let decoded = "";
  try {
    decoded = atob(encoded);
  } catch {
    return unauthorizedResponse();
  }

  const index = decoded.indexOf(":");
  if (index < 0) {
    return unauthorizedResponse();
  }

  const reqUsername = decoded.slice(0, index);
  const reqPassword = decoded.slice(index + 1);

  if (reqUsername !== username || reqPassword !== password) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
