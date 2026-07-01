export const IMAGE_CREDIT_COSTS = {
  thumbnail: 2,
  imageGenerate: 2,
  imageEdit: 2,
} as const;

export function getImageCreditPolicyText() {
  return `AI 썸네일 ${IMAGE_CREDIT_COSTS.thumbnail}크레딧 예정 · 이미지 생성 ${IMAGE_CREDIT_COSTS.imageGenerate}크레딧 예정 · 이미지 편집 ${IMAGE_CREDIT_COSTS.imageEdit}크레딧 예정`;
}
