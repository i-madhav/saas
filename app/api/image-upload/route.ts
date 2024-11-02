import { auth } from '@clerk/nextjs/server';
import { v2 as cloudinary } from 'cloudinary';
import { NextResponse, NextRequest } from 'next/server';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

interface CloudinaryUploadResult {
    public_id: string,
    [key: string]: any
}

async function POST(request: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "unautharized access" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 400 })
        }

        // when a file is uploaded it is important to transform it into arraybuffer that means the uploaded file get converted into binary , which helps in easier manipulation
        const bytes = await file.arrayBuffer();
        // since we are in node environment it is important to convert arraybuffer into buffer
        const buffer = Buffer.from(bytes);
        // by performing buffer now we can upload anything anywhere 

        const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
            // using upload stream help us upload anydata into cloudinary
            const uploadStream = cloudinary.uploader.upload_stream(
                // where should we store our file in cloudinary
                { folder: "next-cloudinary-uploads" },
                (error, result) => {
                    if (error) reject(error) 
                    else resolve(result as CloudinaryUploadResult);
                })

            uploadStream.end(buffer);
        });

        return NextResponse.json({ publicID:result.public_id }, { status: 200 });
    } catch (error) {
        console.log("upload image failed", error);
        return NextResponse.json({error:"upload image failed"},{status:500})
    }}