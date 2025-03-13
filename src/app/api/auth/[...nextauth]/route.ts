import NextAuth from "next-auth";
import Credentials, { CredentialsProvider } from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import UserProfile from "@/models/UserProfile";


export const authOptions = {
  providers: [
    CredentialsProvider({
     name: "Credentials",
     credentials: {
         email: { label: "Official PNP Email", type: "email" },
         password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        await connectDB(); 
        const user = await User.findOne({ email: credentials?.email }).populate("profile");
        if(!user) throw new Error("Invalid email or password");
        const isValidPassword = await bcrypt.compare(credentials!.password, user.password);
        if(!isValidPassword) throw new Error("Invalid email or password");

        return {
            id: user._id,
            email: user.email,
            role: user.role,
            profile: user.profile,
         };
        }
})
],
pages: {
  signIn: "/login",
  callbacks: {
    async session({session, token}) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.profile = token.profile;
        return session;
        },
        async jwt({token, user}) {
            if(user) {
                token.role = user.role;
                token.profile = user.profile;
            }
            return token;
        }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

