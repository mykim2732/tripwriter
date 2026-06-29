export type PostyPlan = "free" | "pro" | "creator" | "business" | string | null | undefined;

export function getWritingStyleLimit(plan: PostyPlan) {
  if (plan === "business") return 10;
  if (plan === "creator") return 5;
  if (plan === "pro") return 3;
  return 1;
}

export function getPlanLabel(plan: PostyPlan) {
  if (plan === "business") return "Business";
  if (plan === "creator") return "Creator";
  if (plan === "pro") return "Pro";
  return "Free";
}
