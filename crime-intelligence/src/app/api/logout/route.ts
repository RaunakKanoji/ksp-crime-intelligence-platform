import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  const requestUrl = new URL(request.url);

  const isLocal =
    process.env.NODE_ENV === "development" ||
    request.headers.get("host")?.includes("localhost") ||
    request.headers.get("host")?.includes("127.0.0.1");

  const catalystDomain = isLocal
    ? process.env.NEXT_PUBLIC_CATALYST_DOMAIN
    : requestUrl.origin;

  const zaid = "50043682168";

  if (catalystDomain) {
    const logoutUrl = `${catalystDomain}/baas/logout?logout=true&PROJECT_ID=${zaid}`;

    try {
      const cookieHeader = allCookies
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join("; ");

      await fetch(logoutUrl, {
        headers: {
          Cookie: cookieHeader,
        },
      });
    } catch (error) {
      console.error("Failed to terminate remote Catalyst session:", error);
    }
  }

  const response = NextResponse.redirect(new URL("/login", request.url));

  for (const cookie of allCookies) {
    response.cookies.set(cookie.name, "", {
      path: "/",
      expires: new Date(0),
      httpOnly: true,
      secure: requestUrl.protocol === "https:",
    });
  }

  return response;
}
