import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
// Import the User model and the IUser interface
import User, { IUser, UserStatus } from "@/models/User";
// --- Import UserProfile model ---
import UserProfile from "@/models/UserProfile";
import mongoose from "mongoose"; // Import mongoose for ObjectId check

// --- Extend the NextAuth types ---
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: "admin" | "user";
      profile: string; // Profile ID as string
      status: UserStatus;
      // --- Add name property ---
      name: string; // Or firstName/lastName if you prefer
    };
  }

  interface User {
    id: string;
    email: string;
    role: "admin" | "user";
    profile: string; // Profile ID as string
    status: UserStatus;
    // --- Add name property ---
    name: string; // Or firstName/lastName
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    role: "admin" | "user";
    profile: string; // Profile ID as string
    status: UserStatus;
    // --- Add name property ---
    name: string; // Or firstName/lastName
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
      async authorize(credentials): Promise<any> {
        if (!credentials?.email || !credentials?.password) {
            console.error("Authorize attempt missing credentials");
            return null;
        }

        await connectDB();

        try {
          const user = await User.findOne({ email: credentials.email })
                                 .select('+password +status +profile') // Ensure profile is selected
                                 .lean();

          if (!user) {
            console.log(`Authorize failed: No user found for email ${credentials.email}`);
            throw new Error("Invalid email or password");
          }

          if (!user.password) {
              console.error(`Authorize failed: Password field missing for user ${credentials.email}`);
              throw new Error("Authentication error");
          }
          const isValidPassword = await bcrypt.compare(credentials.password, user.password);
          if (!isValidPassword) {
            console.log(`Authorize failed: Invalid password for email ${credentials.email}`);
            throw new Error("Invalid email or password");
          }

          if (user.status !== 'approved') {
            console.log(`Authorize failed: User status is '${user.status}' for email ${credentials.email}`);
            throw new Error("Account not approved");
          }

          // --- Fetch User Profile ---
          if (!user.profile || !mongoose.Types.ObjectId.isValid(user.profile.toString())) {
              console.error(`Authorize failed: Invalid or missing profile reference for user ${credentials.email}`);
              throw new Error("User profile configuration error");
          }

          const userProfile = await UserProfile.findOne({ user: user._id }).lean(); // Find profile by user ID

          if (!userProfile) {
              console.error(`Authorize failed: Could not find profile for user ${credentials.email} (Profile Ref: ${user.profile.toString()})`);
              throw new Error("User profile data not found");
          }
          // --- End Fetch User Profile ---


          console.log(`Authorize successful for email ${credentials.email}`);

          // Combine first and last name for display
          const fullName = `${userProfile.firstName} ${userProfile.lastName}`;

          // Return the user object including the name
          return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            profile: user.profile.toString(), // Pass profile ID as string
            status: user.status,
            // --- Add name ---
            name: fullName,
          };

        } catch (error: any) {
            console.error("Error during authorization:", error.message || error);
            if (error.message === "Invalid email or password" || error.message === "Account not approved" || error.message === "User profile configuration error" || error.message === "User profile data not found") {
                throw error;
            }
            throw new Error("An internal error occurred during authentication.");
        }
      }
    })
  ],
  pages: {
    signIn: "/",
  },
  session: {
      strategy: "jwt" as const,
      maxAge: 24 * 60 * 60, // 1 day
  },
  callbacks: {
    async jwt({ token, user }) {
      // Pass user data to token on initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.profile = user.profile;
        token.status = user.status;
        // --- Add name to token ---
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass data from token to session
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          role: token.role,
          profile: token.profile,
          status: token.status,
          // --- Add name to session user ---
          name: token.name
        };
      }
      return session;
    }
  },
  secret: process.env.SESSION_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
