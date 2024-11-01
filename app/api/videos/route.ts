import {NextRequest , NextResponse} from "next/server";
import { PrismaClient } from "@prisma/client";
 
const primsa = new PrismaClient();

export async function GET(request:NextRequest){
    try {
        const videos = await primsa.video.findMany({orderBy:{createdAt:"desc"}});
        return NextResponse.json(videos);
    } catch (error) {
        return NextResponse.json({error},{status:500})
    }finally{
        await primsa.$disconnect();
    }
}