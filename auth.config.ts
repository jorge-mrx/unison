import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.publicId = (user as { publicId: string }).publicId;
        token.isSuperadmin = (user as { isSuperadmin: boolean }).isSuperadmin;
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as { id: string; publicId: string; isSuperadmin: boolean };
      session.user.id = t.id;
      session.user.publicId = t.publicId;
      session.user.isSuperadmin = t.isSuperadmin;
      return session;
    },
  },
} satisfies NextAuthConfig;
