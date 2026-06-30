import { NextRequest, NextResponse } from "next/server";
import { searchReviewSources, type ReviewSourceProvider } from "@/lib/review-api";
import { searchGooglePlaces } from "@/lib/review-providers";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const provider = normalizeProvider(searchParams.get("provider"));
  const query = searchParams.get("query") || "";
  const location = searchParams.get("location") || "";

  return NextResponse.json({
    ...searchReviewSources({ query, provider, location }),
    results: provider === "google" || provider === "all" ? await searchGooglePlaces({ query, location }) : [],
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      query?: string;
      provider?: ReviewSourceProvider | "all";
      location?: string;
    };

    const provider = normalizeProvider(body.provider);
    return NextResponse.json({
      ...searchReviewSources({ query: body.query, provider, location: body.location }),
      results: provider === "google" || provider === "all" ? await searchGooglePlaces({ query: body.query, location: body.location }) : [],
    });
  } catch {
    return NextResponse.json({ message: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }
}

function normalizeProvider(value: unknown): ReviewSourceProvider | "all" {
  if (value === "google" || value === "kakao" || value === "naver") return value;
  return "all";
}
