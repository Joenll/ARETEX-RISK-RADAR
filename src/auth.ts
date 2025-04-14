import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
// Import the User model and the IUser interface
import User, { IUser, UserStatus } from "@/models/User";
import mongoose from "mongoose"; // Import mongoose for ObjectId check

// --- Extend the NextAuth types ---
declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      email: string;
      role: "admin" | "user";
      profile: string; // Profile ID as string
      status: UserStatus; // Add status
    };
  }

  // The User object returned by the authorize callback
  interface User {
    id: string;
    email: string;
    role: "admin" | "user";
    profile: string; // Profile ID as string
    status: UserStatus; // Add status
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    id: string;
    email: string;
    role: "admin" | "user";
    profile: string; // Profile ID as string
    status: UserStatus; // Add status
  }
}
// --- End type extensions ---

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<any> { // Using Promise<any> for simplicity, define specific type if preferred
        if (!credentials?.email || !credentials?.password) {
            // It's better practice to throw specific errors or return null
            // throw new Error("Email and password required");
            console.error("Authorize attempt missing credentials");
            return null; // Indicate failure
        }

        await connectDB();

        try {
          // Find user by email and explicitly select password and status
          // Use .lean() for a plain JS object
          const user = await User.findOne({ email: credentials.email })
                                 .select('+password +status') // Explicitly select password and status
                                 .lean(); // Use lean for plain object

          if (!user) {
            console.log(`Authorize failed: No user found for email ${credentials.email}`);
            // Throwing generic error is good practice for security
            throw new Error("Invalid email or password");
          }

          // Check password
          // Ensure user.password exists before comparing (due to lean() and potential DB issues)
          if (!user.password) {
              console.error(`Authorize failed: Password field missing for user ${credentials.email}`);
              throw new Error("Authentication error"); // Internal error
          }
          const isValidPassword = await bcrypt.compare(credentials.password, user.password);
          if (!isValidPassword) {
            console.log(`Authorize failed: Invalid password for email ${credentials.email}`);
            throw new Error("Invalid email or password");
          }

          // --- Check User Status ---
          if (user.status !== 'approved') {
            console.log(`Authorize failed: User status is '${user.status}' for email ${credentials.email}`);
            // Throw a specific error message for the frontend
            throw new Error("Account not approved");
          }
          // --- End Status Check ---

          console.log(`Authorize successful for email ${credentials.email}`);

          // Ensure profile is valid and convert ObjectId to string
          const profileIdString = user.profile instanceof mongoose.Types.ObjectId
            ? user.profile.toString()
            : typeof user.profile === 'string' ? user.profile : ''; // Handle potential string case or default

          if (!profileIdString) {
              console.error(`Authorize failed: Invalid or missing profile ID for user ${credentials.email}`);
              throw new Error("User profile configuration error");
          }

          // Return the user object for the JWT/session callbacks
          return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            profile: profileIdString, // Pass profile ID as string
            status: user.status // Pass status
          };

        } catch (error: any) {
            console.error("Error during authorization:", error.message || error);
            // Re-throw specific known errors, or a generic one
            if (error.message === "Invalid email or password" || error.message === "Account not approved" || error.message === "User profile configuration error") {
                throw error;
            }
            throw new Error("An internal error occurred during authentication."); // Generic fallback
        }
      }
    })
  ],
  pages: {
    signIn: "/", // Your sign-in page is at the root
    // error: '/auth/error', // Optional: Custom error page
  },
  session: {
      strategy: "jwt" as const,
      maxAge: 24 * 60 * 60, // 1 day session only
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // The 'user' object is available on initial sign-in
      if (user) {
        token.id = user.id;
        token.email = user.email; // Ensure email is present
        token.role = user.role;
        token.profile = user.profile; // Should be string from authorize
        token.status = user.status; // Add status
      }
      return token;
    },
    async session({ session, token }) {
      // The 'token' object contains the data from the 'jwt' callback
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          role: token.role,
          profile: token.profile,
          status: token.status // Add status to session user
        };
      }
      return session;
    }
  },
  secret: process.env.SESSION_SECRET,
  // Optional: Add debug logging in development
  // debug: process.env.NODE_ENV === 'development',
};

// Export handlers for Next.js API routes (App Router)
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
// If using Pages Router, you might export default NextAuth(authOptions)
