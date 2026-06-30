import { NextRequest, NextResponse } from "next/server";
import { editImageAsset, type ImageAiRequest } from "@/lib/image-ai";

export async function POST(request: NextRequest) {
  try {
    const input = (await request.json()) as ImageAiRequest;
    const result = await editImageAsset(input);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ message: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }
}
