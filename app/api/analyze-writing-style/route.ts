
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
const OPENAI_MODEL = "gpt-4.1-mini";
type StyleResponse = { styleName: string; toneSummary: string; sentenceStyle: string; vocabulary: string[]; emojiStyle: string; paragraphStyle: string; titleStyle: string; ctaStyle: string; doRules: string[]; dontRules: string[] };
export async function POST(request: NextRequest) {
  const input = await request.json().catch(() => null) as { sampleText?: string; styleName?: string } | null;
  if (!input?.sampleText?.trim()) return NextResponse.json({ message: "Please paste a writing sample." }, { status: 400 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ message: "OPENAI_API_KEY is missing." }, { status: 500 });
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({ model: OPENAI_MODEL, input: [{ role: "developer", content: "You analyze a user's writing style. Do not store personal or sensitive information. Do not copy long copyrighted text. Extract tone, sentence style, emoji usage, paragraph structure, title style, CTA style, do rules, and don't rules. Return JSON only." }, { role: "user", content: `Style name: ${input.styleName || "My style"}\nSample:\n${input.sampleText}\n\nReturn keys: styleName, toneSummary, sentenceStyle, vocabulary, emojiStyle, paragraphStyle, titleStyle, ctaStyle, doRules, dontRules` }], text: { format: { type: "json_object" } } });
    const parsed = JSON.parse(response.output_text) as Partial<StyleResponse>;
    return NextResponse.json({ styleName: String(parsed.styleName || input.styleName || "My style"), toneSummary: String(parsed.toneSummary || "Natural and readable"), sentenceStyle: String(parsed.sentenceStyle || "Medium-length sentences"), vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary.map(String).slice(0, 12) : [], emojiStyle: String(parsed.emojiStyle || "Medium"), paragraphStyle: String(parsed.paragraphStyle || "Short paragraphs"), titleStyle: String(parsed.titleStyle || "Specific titles"), ctaStyle: String(parsed.ctaStyle || "Natural CTA"), doRules: Array.isArray(parsed.doRules) ? parsed.doRules.map(String).slice(0, 8) : [], dontRules: Array.isArray(parsed.dontRules) ? parsed.dontRules.map(String).slice(0, 8) : [] });
  } catch (error) { console.error("Writing style analysis failed", error); return NextResponse.json({ message: error instanceof Error ? error.message : "Writing style analysis failed." }, { status: 500 }); }
}
