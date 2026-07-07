import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // 1. Get all cookies from the incoming request
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();

  // 2. Determine target domain for Catalyst
  const isLocal =
    process.env.NODE_ENV === "development" ||
    request.headers.get("host")?.includes("localhost") ||
    request.headers.get("host")?.includes("127.0.0.1");

  const catalystDomain = isLocal
    ? "https://ksp-crime-app-60076540751.development.catalystserverless.in"
    : new URL(request.url).origin;

  const zaid = "50043682168"; // Catalyst App ID
  const logoutUrl = `${catalystDomain}/baas/logout?logout=true&PROJECT_ID=${zaid}`;

  try {
    // Forward the client's cookies so Catalyst backend knows which session to destroy
    const cookieHeader = allCookies.map((c) => `${c.name}=${c.value}`).join("; ");
    await fetch(logoutUrl, {
      headers: {
        Cookie: cookieHeader,
      },
    });
  } catch (err) {
    console.error("Failed to terminate remote Catalyst session:", err);
  }

  // 3. Create a redirect response to /login
  const response = NextResponse.redirect(new URL("/login", request.url));

  // 4. Expire all cookies on the current domain (localhost or production)
  for (const cookie of allCookies) {
    response.cookies.set(cookie.name, "", {
      path: "/",
      expires: new Date(0),
      httpOnly: true,
      secure: true,
    });
  }

  return response;
}
