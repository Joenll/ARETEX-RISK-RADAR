// src/auth.ts
import NextAuth, { AuthOptions, User as NextAuthUser } from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
// Correct adapter import for NextAuth v4/v5 with MongoDB native driver
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User, { IUser, UserStatus } from "@/models/User"; // Import IUser interface
import UserProfile from "@/models/UserProfile"; // Ensure UserProfile model is imported
import mongoose from "mongoose"; // Import mongoose itself
import { MongoClient } from "mongodb"; // Import MongoClient

// --- Type Extensions ---
// Add profileComplete and make profile/name optional
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: "admin" | "user";
      profile?: string; // Profile might not exist initially
      status: UserStatus;
      name?: string; // Name might not exist initially
      profileComplete: boolean; // Added profileComplete flag
    };
  }

  // Extend the default NextAuth User type
  // Note: Renamed to avoid conflict with the imported User model
  interface AdapterUser extends NextAuthUser {
    // id, email, name, image are part of NextAuthUser
    role: "admin" | "user";
    profile?: string; // Profile might not exist initially
    status: UserStatus;
    profileComplete: boolean; // Added profileComplete flag
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    role: "admin" | "user";
    profile?: string; // Profile might not exist initially
    status: UserStatus;
    name?: string; // Name might not exist initially
    profileComplete: boolean; // Added profileComplete flag
    // 'sub' is standard in JWT for user ID, ensure it's string
    sub?: string;
  }
}
// --- End Type Extensions ---


// Helper function to get the MongoClient promise
async function getMongoClientPromise(): Promise<MongoClient> {
  await connectDB(); // Ensure connection is established
  // Mongoose connection object might have the client directly or within db object
  const client = mongoose.connection.getClient();
  if (!client) {
    throw new Error("Failed to get MongoDB client from Mongoose connection.");
  }
  // The adapter expects a MongoClient instance
  return client as unknown as MongoClient;
}


export const authOptions: AuthOptions = {
  // --- Configure the MongoDB Adapter ---
  // Pass the promise that resolves to the MongoClient
  adapter: MongoDBAdapter(getMongoClientPromise()),

  providers: [
    // --- Google Provider Configuration ---
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    // --- Credentials Provider (Existing - Modified Authorize) ---
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<any> { // Using 'any' for simplicity, refine if possible
        if (!credentials?.email || !credentials?.password) {
          console.error("[Auth] Authorize attempt missing credentials");
          return null;
        }

        await connectDB();

        try {
          // Fetch user with necessary fields for validation AND session/token
          const user = await User.findOne({ email: credentials.email })
            .select("+password +status +profile +role +profileComplete +name") // Select all needed fields
            .lean();

          if (!user) {
            console.log(`[Auth] Authorize failed: No user found for email ${credentials.email}`);
            return null;
          }

          if (!user.password) {
            console.warn(`[Auth] Authorize failed: User ${credentials.email} exists but has no password (likely OAuth).`);
            return null;
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );
          if (!isValidPassword) {
            console.log(`[Auth] Authorize failed: Invalid password for email ${credentials.email}`);
            return null;
          }

          // NOTE: Status check moved to signIn callback for consistency across providers

          console.log(`[Auth] Authorize successful for email ${credentials.email}`);

          // --- Logic to determine the best name ---
          let finalName = user.name; // Start with name from User model
          if ((!finalName || finalName.trim() === '') && user.profile && mongoose.Types.ObjectId.isValid(user.profile.toString())) {
            console.log(`[Auth] Authorize: User.name missing, attempting to fetch from UserProfile ID: ${user.profile.toString()}`);
            try {
              const userProfile = await UserProfile.findById(user.profile).select('firstName lastName').lean();
              if (userProfile && userProfile.firstName && userProfile.lastName) {
                finalName = `${userProfile.firstName} ${userProfile.lastName}`.trim();
                console.log(`[Auth] Authorize: Constructed name from UserProfile: ${finalName}`);
              } else {
                 console.warn(`[Auth] Authorize: UserProfile found but missing name fields for profile ID: ${user.profile.toString()}`);
              }
            } catch (profileError) {
               console.error(`[Auth] Authorize: Error fetching UserProfile for ID ${user.profile.toString()}:`, profileError);
            }
          }
          // --- End name logic ---

          // Return the full user object expected by NextAuth callbacks
          return {
            id: user._id.toString(), // This is the MongoDB ObjectId string
            email: user.email,
            role: user.role,
            profile: user.profile?.toString(),
            status: user.status,
            name: finalName, // Use the determined name
            profileComplete: user.profileComplete ?? false,
            // image: user.image, // Include if you add image to your User model
          };

        } catch (error: any) {
          console.error("[Auth] Error during authorization:", error.message || error);
          throw new Error("Authentication error occurred.");
        }
      },
    }),
  ],
  pages: {
    signIn: "/", // Your main page acts as the sign-in page
    // error: '/auth/error', // Optional: Custom error page
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 day
  },
  callbacks: {
    // --- signIn Callback ---
    // Central place to check status *after* authentication succeeds (Credentials or OAuth)
    async signIn({ user, account, profile, email, credentials }) {
      console.log(`[Auth] signIn callback triggered for user: ${user.email}, Provider: ${account?.provider ?? 'credentials'}`);

      // The user.id *should* be the MongoDB ObjectId string from the adapter or authorize
      const userId = user.id;

      if (!userId) {
          console.error("[Auth] signIn callback: No user ID provided in user object.");
          return false; // Prevent sign-in
      }

      // --- REMOVED Validation: Check if ID is a valid ObjectId format ---
      // We'll trust the ID provided by the adapter/authorize at this stage
      // and focus on checking the user's status from the DB.
      // The jwt callback handles potential ID format issues later.
      // --- End REMOVED Validation ---

      await connectDB();
      try {
          // Attempt to find the user by the provided ID.
          const dbUser = await User.findById(userId).select('status').lean(); // Only need status here

          if (!dbUser) {
              console.warn(`[Auth] signIn callback: User not found in DB with ID: ${userId}. This might be temporary during OAuth flow if ID is not ObjectId yet. Allowing flow to continue to JWT callback.`);
              return true; // Allow flow to continue to JWT callback
          }

          // --- Centralized Status Check ---
          if (dbUser.status === 'pending') {
              console.log(`[Auth] signIn blocked: User ${user.email} status is 'pending'.`);
              throw new Error("Account not approved");
          }
          if (dbUser.status === 'rejected') {
              console.log(`[Auth] signIn blocked: User ${user.email} status is 'rejected'.`);
              throw new Error("Account rejected");
          }

          // If user found and status is approved
          console.log(`[Auth] signIn allowed for user: ${user.email} (Status: ${dbUser.status})`);
          return true; // Allow session creation

      } catch (error: any) {
          // Handle specific errors thrown above
          if (error.message === "Account not approved" || error.message === "Account rejected") {
              throw error; // Rethrow specific errors for frontend handling
          }
          // Handle potential CastError if findById was called with an invalid format ID
          if (error.name === 'CastError' && error.path === '_id') {
               console.warn(`[Auth] signIn callback: CastError finding user by ID ${userId}. This might be temporary during OAuth flow. Allowing flow to continue to JWT callback.`);
               return true; // Allow flow to continue to JWT callback
          }

          // Handle other unexpected errors
          console.error(`[Auth] signIn callback: Unexpected error during DB lookup or status check for user ID ${userId}:`, error);
          return false; // Prevent sign-in on other errors
      }
  },

    // --- jwt Callback ---
    // Populates the JWT token. Called on sign-in and potentially on session access.
    async jwt({ token, user, account, profile, trigger, session }) {
      await connectDB(); // Ensure DB connection for potential fetches

      // Determine the user ID to use for fetching data.
      let userIdToFetch: string | undefined = user?.id || token?.sub;

      // --- Validate the user ID format before fetching ---
      if (userIdToFetch && !mongoose.Types.ObjectId.isValid(userIdToFetch)) {
          console.warn(`[Auth] jwt callback: Invalid user ID format found: ${userIdToFetch}. Attempting fallback.`);
          // Fallback: If it's initial Google sign-in and ID is invalid, try finding user by email.
          if (user?.email && account?.provider === 'google' && !mongoose.Types.ObjectId.isValid(user.id)) {
              try {
                  const userByEmail = await User.findOne({ email: user.email }).select('_id').lean();
                  if (userByEmail) {
                      console.log(`[Auth] jwt callback: Fallback successful. Found user by email (${user.email}), using DB ID: ${userByEmail._id.toString()}`);
                      userIdToFetch = userByEmail._id.toString(); // Correct the ID
                  } else {
                      console.error(`[Auth] jwt callback: Fallback failed. Invalid ID (${user.id}) and could not find user by email: ${user.email}`);
                      userIdToFetch = undefined; // Cannot proceed
                  }
              } catch (dbError) {
                  console.error(`[Auth] jwt callback: Error during email fallback lookup for ${user.email}:`, dbError);
                  userIdToFetch = undefined;
              }
          } else {
               console.error(`[Auth] jwt callback: Invalid user ID format (${userIdToFetch}) and cannot resolve via fallback.`);
               userIdToFetch = undefined; // Cannot proceed
          }
      }
      // --- End Validation ---


      // Proceed only if we have a valid user ID
      if (userIdToFetch) {
          // --- Initial Sign-in or Session Update Trigger ---
          if (user || trigger === "update") {
              if (user) console.log(`[Auth] jwt callback: Initial sign-in. Populating token using ID: ${userIdToFetch}.`);
              else console.log(`[Auth] jwt callback: Update trigger. Refreshing token data using ID: ${userIdToFetch}.`);

              try {
                  // Fetch user including name and profile link
                  const dbUser = await User.findById(userIdToFetch).select('email role status profileComplete name profile').lean();
                  if (dbUser) {
                      // --- Logic to determine the best name ---
                      let finalName = dbUser.name; // Start with name from User model
                      if ((!finalName || finalName.trim() === '') && dbUser.profile && mongoose.Types.ObjectId.isValid(dbUser.profile.toString())) {
                         console.log(`[Auth] jwt: User.name missing, attempting fetch from UserProfile ID: ${dbUser.profile.toString()}`);
                         try {
                            const userProfile = await UserProfile.findById(dbUser.profile).select('firstName lastName').lean();
                            if (userProfile && userProfile.firstName && userProfile.lastName) {
                               finalName = `${userProfile.firstName} ${userProfile.lastName}`.trim();
                               console.log(`[Auth] jwt: Constructed name from UserProfile: ${finalName}`);
                            } else {
                               console.warn(`[Auth] jwt: UserProfile found but missing name fields for profile ID: ${dbUser.profile.toString()}`);
                            }
                         } catch (profileError) {
                            console.error(`[Auth] jwt: Error fetching UserProfile for ID ${dbUser.profile.toString()}:`, profileError);
                         }
                      }
                      // --- End name logic ---

                      // Populate token
                      token.id = dbUser._id.toString();
                      token.email = dbUser.email;
                      token.role = dbUser.role;
                      token.status = dbUser.status;
                      token.profileComplete = dbUser.profileComplete ?? false;
                      token.name = finalName; // Use the determined name
                      token.profile = dbUser.profile?.toString();
                      token.sub = dbUser._id.toString(); // Ensure token.sub is the correct DB ID string
                      console.log(`[Auth] jwt callback: Token populated/refreshed from DB:`, { id: token.id, name: token.name, role: token.role, status: token.status, profileComplete: token.profileComplete });

                  } else {
                      console.error(`[Auth] jwt callback: Could not find user ${userIdToFetch} in DB during population/refresh. Returning original token.`);
                      return token; // Return original token if user lookup fails
                  }
              } catch (error) {
                  console.error(`[Auth] jwt callback: Error fetching user ${userIdToFetch} from DB:`, error);
                  return token; // Return original token on DB error
              }
          }
          // --- Subsequent Requests ---
          // (Optional logic for re-checking profileComplete remains commented out)
      } else {
          console.error("[Auth] jwt callback: Cannot proceed without a valid user ID. Returning original token.");
          return token; // Return original token if ID is invalid
      }

      return token; // Return the populated/refreshed token
    },


    // --- session Callback ---
    // Makes data from the JWT available to the client-side `useSession` hook.
    async session({ session, token }) {
      // Assign properties from the token to session.user
      // Ensure all properties exist on the token before assigning
      if (token && session.user) {
        session.user.id = token.id || token.sub || ''; // Use id or sub, fallback to empty string
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.profileComplete = token.profileComplete ?? false; // Ensure boolean
        session.user.name = token.name; // Assign name from token
        session.user.profile = token.profile;
        session.user.email = token.email || ''; // Ensure email exists
      } else if (!token || Object.keys(token).length === 0) { // Check if token is null or empty object
          // If token is somehow null or empty, invalidate the session
          console.warn("[Auth] session callback: Received empty or invalid token. Returning null session.");
          return null as any; // Return null to indicate no active session
      }
      // console.log("[Auth] session callback, returning session:", JSON.stringify(session, null, 2)); // Debug log
      return session; // Return the session object for the client
    },
  },
  secret: process.env.SESSION_SECRET, // Ensure this is set in your .env file
  // debug: process.env.NODE_ENV === 'development', // Optional: Enable for more logs
};

// Export handlers and auth functions
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

// Helper function to trigger session update (call this from your API route after success)
import { getServerSession } from "next-auth/next";

export async function updateSession(req: Request) {
    const session = await getServerSession(authOptions);
    if (session) {
        // This primarily signals the JWT callback's "update" trigger.
        console.log("[Auth Helper] Triggering session update (flagging for refresh).");
        // In NextAuth v5+, direct manipulation is discouraged. Rely on the JWT update flow.
    }
}
