import OpenAI, { toFile } from "openai";

export type ImageAiStyle = "minimal" | "diary" | "review" | "detail";

export type ImageAiRequest = {
  prompt?: string;
  style?: ImageAiStyle | string;
  size?: "1024x1024" | "1536x1024" | "1024x1536" | "auto";
  sourceImageDataUrl?: string;
};

export type ImageAiResult = {
  mode: "openai" | "mock";
  imageUrl?: string;
  b64Json?: string;
  revisedPrompt?: string;
  message: string;
  preservesOriginal: true;
};

const IMAGE_MODEL = "gpt-image-1";

export async function generateImageAsset(input: ImageAiRequest): Promise<ImageAiResult> {
  const prompt = buildPrompt(input);
  if (!process.env.OPENAI_API_KEY) return mockImageResult("OPENAI_API_KEY가 없어 mock preview만 제공합니다.", prompt);

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.images.generate({
      model: IMAGE_MODEL,
      prompt,
      size: input.size || "1024x1024",
      quality: "auto",
      output_format: "png",
      n: 1,
    });
    const image = response.data?.[0];
    return {
      mode: "openai",
      imageUrl: image?.url,
      b64Json: image?.b64_json,
      revisedPrompt: image?.revised_prompt || prompt,
      message: "새 이미지 후보를 생성했어요. 원본 사진은 변경하지 않았습니다.",
      preservesOriginal: true,
    };
  } catch (error) {
    return mockImageResult(error instanceof Error ? error.message : "이미지 생성에 실패해 mock preview를 제공합니다.", prompt);
  }
}

export async function editImageAsset(input: ImageAiRequest): Promise<ImageAiResult> {
  const prompt = buildPrompt(input);
  if (!input.sourceImageDataUrl) return mockImageResult("수정할 원본 이미지 data URL이 없어 mock edit preview만 제공합니다.", prompt);
  if (!process.env.OPENAI_API_KEY) return mockImageResult("OPENAI_API_KEY가 없어 mock edit preview만 제공합니다.", prompt);

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const file = await dataUrlToFile(input.sourceImageDataUrl, "posty-source.png");
    const response = await client.images.edit({
      model: IMAGE_MODEL,
      image: file,
      prompt,
      size: input.size || "1024x1024",
      quality: "auto",
      output_format: "png",
      n: 1,
    });
    const image = response.data?.[0];
    return {
      mode: "openai",
      imageUrl: image?.url,
      b64Json: image?.b64_json,
      revisedPrompt: image?.revised_prompt || prompt,
      message: "새 편집 이미지 후보를 생성했어요. 원본 사진은 변경하지 않았습니다.",
      preservesOriginal: true,
    };
  } catch (error) {
    return mockImageResult(error instanceof Error ? error.message : "이미지 수정에 실패해 mock preview를 제공합니다.", prompt);
  }
}

function buildPrompt(input: ImageAiRequest) {
  const style = input.style || "minimal";
  const base = input.prompt?.trim() || "Posty AI content thumbnail, clean mobile-first composition";
  return [
    base,
    `Style: ${style}.`,
    "Keep text minimal, avoid fake logos, avoid misleading claims.",
    "Create a fresh generated asset candidate; do not overwrite or alter the original uploaded photo.",
  ].join("\n");
}

function mockImageResult(message: string, prompt: string): ImageAiResult {
  return {
    mode: "mock",
    revisedPrompt: prompt,
    message,
    preservesOriginal: true,
  };
}

async function dataUrlToFile(dataUrl: string, fileName: string) {
  const [header, payload] = dataUrl.split(",");
  const mime = header?.match(/data:(.*?);base64/)?.[1] || "image/png";
  const bytes = Buffer.from(payload || "", "base64");
  return toFile(bytes, fileName, { type: mime });
}
