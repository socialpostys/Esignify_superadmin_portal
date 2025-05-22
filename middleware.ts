import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Get user role from cookie
  const userRole = request.cookies.get("user_role")?.value
  const organizationId = request.cookies.get("organization_id")?.value

  // Public paths that don't require authentication
  const publicPaths = ["/", "/login"]

  // Org-specific login paths are also public
  const isOrgLoginPath = path.startsWith("/org/") && path.endsWith("/login")

  // Check if the path is public
  const isPublicPath = publicPaths.includes(path) || isOrgLoginPath

  // If path is public and user is authenticated, redirect to dashboard
  if (isPublicPath && userRole) {
    if (userRole === "super_admin") {
      return NextResponse.redirect(new URL("/super-admin/dashboard", request.url))
    } else if (userRole === "org_admin") {
      return NextResponse.redirect(new URL("/org-admin/dashboard", request.url))
    }
  }

  // If path is not public and user is not authenticated, redirect to login
  if (!isPublicPath && !userRole) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // If user is trying to access a role-specific path they don't have access to
  if (path.startsWith("/super-admin") && userRole !== "super_admin") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (path.startsWith("/org-admin") && userRole !== "org_admin" && userRole !== "super_admin") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // For organization-specific operations, check if the user has access to that organization
  if (path.includes("/organizations/") && userRole === "org_admin") {
    const pathOrgId = path.split("/")[3] // Extract organization ID from path

    // If the organization ID in the path doesn't match the user's organization ID, restrict access
    if (pathOrgId && pathOrgId !== organizationId) {
      return NextResponse.redirect(new URL("/org-admin/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
