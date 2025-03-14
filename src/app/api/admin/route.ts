import { auth, authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { AuthOptions } from "next-auth";

// only admins can access this API

export async function GET(req: Request){
    const session = await getServerSession(authOptions);
    if(!session || session.user.role !== "admin") return {status: 401, data: {message: "Unauthorized"}};
    return {status: 200, data: {message: "Hello Admin!"}};
}