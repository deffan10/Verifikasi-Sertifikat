import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/admin/login",
  },
});

export const config = {
  matcher: [
    "/admin/dashboard/:path*",
    "/admin/document-types/:path*",
    "/admin/documents/:path*",
    "/admin/activity-logs/:path*",
    "/admin/settings/:path*",
    "/api/document-types/:path*",
    "/api/documents/:path*",
    "/api/stats/:path*",
    "/api/activity-logs/:path*",
    "/api/admin/:path*",
  ],
};
