import CredentialsProvider from "next-auth/providers/credentials";

import { comparePassword } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { normalizeUserRole } from "@/lib/roles";
import User from "@/models/User";

export const authOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email y contraseña",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim()?.toLowerCase();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        await connectDB();

        const user = await User.findOne({ email, isActive: true }).select("+password customer");

        if (!user) {
          return null;
        }

        const isValidPassword = await comparePassword(password, user.password);

        if (!isValidPassword) {
          return null;
        }

        return {
          customerId: user.customer?.toString() || null,
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: normalizeUserRole(user.role),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.customerId = user.customerId;
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.customerId = token.customerId;
        session.user.id = token.id;
        session.user.role = token.role;
      }

      return session;
    },
  },
};
