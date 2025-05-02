// src/app/api/profile/upload-picture/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth'; // Adjust path to your auth options
import path from 'path';
import fs from 'fs/promises'; // Use promises for async file operations
import { v4 as uuidv4 } from 'uuid'; // For generating unique filenames
import { fileTypeFromBuffer } from 'file-type'; // Import file-type library

// --- Configuration ---
// Define the directory where profile pictures will be stored within the 'public' folder
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'profile-pictures');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']; // Define allowed types globally

// --- Helper Function to Ensure Directory Exists ---
const ensureUploadDirExists = async () => {
    try {
        // Check if directory exists
        await fs.access(UPLOAD_DIR);
    } catch (error: any) {
        // If error is 'ENOENT' (Not Found), create the directory
        if (error.code === 'ENOENT') {
            try {
                await fs.mkdir(UPLOAD_DIR, { recursive: true });
                console.log(`[API upload-picture] Created upload directory: ${UPLOAD_DIR}`);
            } catch (mkdirError) {
                console.error(`[API upload-picture] Failed to create upload directory ${UPLOAD_DIR}:`, mkdirError);
                // Throw a more specific error for easier debugging
                throw new Error('Server configuration error: Could not create upload directory.');
            }
        } else {
            // Re-throw other errors (like permission issues)
            console.error(`[API upload-picture] Error accessing upload directory ${UPLOAD_DIR}:`, error);
            throw new Error('Server error: Could not access upload directory.');
        }
    }
};

export async function POST(request: Request) {
    console.log("[API upload-picture] Received POST request.");
    const session = await getServerSession(authOptions);

    // 1. Authentication Check (Adjust based on your session structure: id, _id, or sub)
    const userId = session?.user?.id;
    if (!userId) {
        console.warn("[API upload-picture] Unauthorized access attempt.");
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`[API upload-picture] User authenticated: ${userId}`);

    try {
        // 2. Ensure Upload Directory Exists
        await ensureUploadDirExists();
        console.log("[API upload-picture] Upload directory verified.");

        // 3. Parse Form Data
        const formData = await request.formData();
        const file = formData.get('profilePicture') as File | null;

        if (!file) {
            console.warn("[API upload-picture] No file found in form data.");
            return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
        }
        console.log(`[API upload-picture] Received file: ${file.name}, Size: ${file.size}, Type: ${file.type}`);

        // 4. Basic File Validation (Size and Reported Type)
        if (file.size > MAX_FILE_SIZE) {
            console.warn(`[API upload-picture] File size exceeded limit: ${file.size}`);
            return NextResponse.json({ error: `File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB.` }, { status: 413 }); // 413 Payload Too Large
        }
        // Check the type reported by the browser first (quick check)
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            console.warn(`[API upload-picture] Invalid file type: ${file.type}`);
            return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, GIF, WEBP are allowed.' }, { status: 415 }); // 415 Unsupported Media Type
        }
        console.log("[API upload-picture] Basic file validation passed.");

        // 5. Read File Buffer for Content Validation
        const buffer = Buffer.from(await file.arrayBuffer());

        // 6. Magic Number Validation (Verify actual file type)
        const detectedType = await fileTypeFromBuffer(buffer);
        if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType.mime)) {
            console.warn(`[API upload-picture] Magic number check failed. Reported: ${file.type}, Detected: ${detectedType?.mime}. User: ${userId}`);
            return NextResponse.json({ error: "File content does not match allowed image types." }, { status: 415 }); // 415 Unsupported Media Type
        }
        console.log(`[API upload-picture] Magic number validation passed. Detected type: ${detectedType.mime}`);

        // 7. Generate Unique Filename & Path (using detected extension for safety)
        // const fileExtension = path.extname(file.name); // Less reliable
        const fileExtension = `.${detectedType.ext}`; // Use extension from detected type
        const uniqueFilename = `${uuidv4()}${fileExtension.toLowerCase()}`;
        const filePath = path.join(UPLOAD_DIR, uniqueFilename);
        console.log(`[API upload-picture] Generated unique filename: ${uniqueFilename}`);

        // 6. Save File Locally (IMPORTANT: Replace with cloud storage for production)
        await fs.writeFile(filePath, buffer);
        console.log(`[API upload-picture] File saved locally: ${filePath}`);

        // 9. Construct Public URL (Relative to the 'public' folder)
        const imageUrl = `/uploads/profile-pictures/${uniqueFilename}`;
        console.log(`[API upload-picture] Constructed image URL: ${imageUrl}`);

        // 10. Return Success Response with the URL
        console.log("[API upload-picture] Upload successful. Returning URL.");
        return NextResponse.json({ success: true, imageUrl: imageUrl });

    } catch (error: any) {
        console.error('[API upload-picture] Profile picture upload error:', error);
        return NextResponse.json({ error: 'Failed to upload profile picture due to a server error.' }, { status: 500 });
    }
}