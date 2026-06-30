import { NextRequest, NextResponse } from "next/server";
import { searchReviewSources, type ReviewSourceProvider } from "@/lib/review-api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const provider = normalizeProvider(searchParams.get("provider"));

  return NextResponse.json(
    searchReviewSources({
      query: searchParams.get("query") || "",
      provider,
      location: searchParams.get("location") || "",
    }),
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      query?: string;
      provider?: ReviewSourceProvider | "all";
      location?: string;
    };

    return NextResponse.json(
      searchReviewSources({
        query: body.query,
        provider: normalizeProvider(body.provider),
        location: body.location,
      }),
    );
  } catch {
    return NextResponse.json({ message: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }
}

function normalizeProvider(value: unknown): ReviewSourceProvider | "all" {
  if (value === "google" || value === "kakao" || value === "naver") return value;
  return "all";
}
