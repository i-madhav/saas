import { auth as a, clerkMiddleware , createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/signin" , "/signup" , "/home" , "/"]);
const isPublicApiRoute = createRouteMatcher(["/api/videos"])

export default clerkMiddleware(async (auth , request) => {
  const {userId} = await auth();
  const currentUrl = new URL(request.url);
  const isAccessingHome = currentUrl.pathname === "/home";
  const isApiRequest = currentUrl.pathname.startsWith("/api");

  if(userId && isPublicRoute(request) && !isAccessingHome){
    return NextResponse.redirect(new URL("/home" , request.url));
  }

  // not loggedin
  if(!userId){
    if(!isPublicRoute(request) && !isPublicApiRoute(request)){
      return NextResponse.redirect(new URL("/signin" , request.url));
    }

    // if request is for a protectedRoute Apiand user is not logged in redirect him to logged in route
    if(isApiRequest && !isPublicApiRoute(request)){
      return NextResponse.redirect(new URL("/signin" , request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};