import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

function envPath(value: string | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  try {
    return new URL(value).pathname;
  } catch {
    return value;
  }
}

const signInPath = envPath(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL, "/sign-in");
const signUpPath = envPath(process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL, "/sign-up");

const isPublicRoute = createRouteMatcher([
  signInPath,
  `${signInPath}(.*)`,
  signUpPath,
  `${signUpPath}(.*)`,
]);

const proxy = clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    const { isAuthenticated } = await auth();

    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/editor", request.url));
    }

    return NextResponse.next();
  }

  await auth.protect();
});

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    "/(api|trpc)(.*)",
  ],
};
