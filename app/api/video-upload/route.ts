import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

interface CloudinaryUploadResult {
    public_id: string,
    originalSize?: string,
    compressedSize?:any,
    duration?:number
    [key:string]: any
}

async function POST(request: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "unautharized access" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const originalSize = formData.get("originalSize") as string;

        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await new Promise<CloudinaryUploadResult>(async (resolve, rejects) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: "video-uploads", resource_type: "video", transformation: [{ quality: "auto", fetch_format: "mp4" }] },
                (error, result) => {
                    if (error) { rejects(error) }
                    else resolve(result as CloudinaryUploadResult)
                });

            uploadStream.end(buffer);
        })

           // here comes the prisma part
           const video = await prisma.video.create({
            data: {
                title: title,
                description,
                publicId: result.public_id,
                originalSize: originalSize,
                compressedSize: String(result.bytes),
                duration: result.duration || 0
            }
        })

        return NextResponse.json(video , {status:200});

    } catch (error) {
        console.log("upload video failed", error);
        return NextResponse.json({ error: "upload video failed" }, { status: 500 })
    }finally{
        await prisma.$disconnect();
    }
}