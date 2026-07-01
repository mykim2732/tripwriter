import OpenAI, { toFile } from "openai";
import { IMAGE_CREDIT_COSTS } from "@/lib/image-credit-policy";

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
  creditPolicy: {
    plannedCost: number;
    charged: boolean;
    note: string;
  };
};

const IMAGE_MODEL = "gpt-image-1";

export async function generateImageAsset(input: ImageAiRequest): Promise<ImageAiResult> {
  const prompt = buildPrompt(input);
  if (!process.env.OPENAI_API_KEY) return mockImageResult("OPENAI_API_KEY가 없어 mock preview만 제공합니다.", prompt, IMAGE_CREDIT_COSTS.imageGenerate);

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
      creditPolicy: billedPolicy(IMAGE_CREDIT_COSTS.imageGenerate),
    };
  } catch (error) {
    return mockImageResult(error instanceof Error ? error.message : "이미지 생성에 실패해 mock preview를 제공합니다.", prompt, IMAGE_CREDIT_COSTS.imageGenerate);
  }
}

export async function editImageAsset(input: ImageAiRequest): Promise<ImageAiResult> {
  const prompt = buildPrompt(input);
  if (!input.sourceImageDataUrl) return mockImageResult("수정할 원본 이미지 data URL이 없어 mock edit preview만 제공합니다.", prompt, IMAGE_CREDIT_COSTS.imageEdit);
  if (!process.env.OPENAI_API_KEY) return mockImageResult("OPENAI_API_KEY가 없어 mock edit preview만 제공합니다.", prompt, IMAGE_CREDIT_COSTS.imageEdit);

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
      creditPolicy: billedPolicy(IMAGE_CREDIT_COSTS.imageEdit),
    };
  } catch (error) {
    return mockImageResult(error instanceof Error ? error.message : "이미지 수정에 실패해 mock preview를 제공합니다.", prompt, IMAGE_CREDIT_COSTS.imageEdit);
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

function mockImageResult(message: string, prompt: string, plannedCost: number): ImageAiResult {
  return {
    mode: "mock",
    revisedPrompt: prompt,
    message,
    preservesOriginal: true,
    creditPolicy: {
      plannedCost,
      charged: false,
      note: "mock 상태에서는 이미지 AI 크레딧을 차감하지 않습니다.",
    },
  };
}

function billedPolicy(plannedCost: number) {
  return {
    plannedCost,
    charged: false,
    note: "이미지 AI 크레딧 차감 정책은 준비됐으며 실제 차감 연결은 다음 단계에서 적용합니다.",
  };
}

async function dataUrlToFile(dataUrl: string, fileName: string) {
  const [header, payload] = dataUrl.split(",");
  const mime = header?.match(/data:(.*?);base64/)?.[1] || "image/png";
  const bytes = Buffer.from(payload || "", "base64");
  return toFile(bytes, fileName, { type: mime });
}
