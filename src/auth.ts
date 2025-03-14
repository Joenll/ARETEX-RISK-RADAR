import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// Extend the User type in NextAuth
declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    role: "admin" | "user";
    profile: string; // Add profile
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: "admin" | "user";
      profile: string; // Add profile
    };
  }
}

interface JWT {
  id: string;
  email: string;
  role: "admin" | "user";
  profile: string; // Add profile
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        await connectDB();

        // Find user by email
        const user = await User.findOne({ email: credentials?.email });
        if (!user) throw new Error("Invalid email or password");

        // Check password
        const isValidPassword = await bcrypt.compare(credentials!.password, user.password);
        if (!isValidPassword) throw new Error("Invalid email or password");

        return {
          id: user._id.toString(),
          email: user.email,
          role: user.role, // Include role
          profile: user.profile // Include profile
        };
      }
    })
  ],
  pages: {
    signIn: "/ui/signin",
  },
  session: { strategy: "jwt" as const },
  callbacks: {
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        email: token.email as string,
        role: token.role as "admin" | "user",
        profile: token.profile as string // Include profile
      };
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.profile = user.profile; // Include profile
      }
      return token;
    }
  },
  secret: process.env.SESSION_SECRET
};

export const { handlers, auth } = NextAuth(authOptions);