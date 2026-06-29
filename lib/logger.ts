export type LogLevel = "info" | "warn" | "error";
export type LogCategory = "client" | "server" | "api" | "ai" | "supabase" | "payment" | "publish";

export type AppLog = {
  id: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  detail?: string;
  createdAt: string;
};

const memoryLogs: AppLog[] = [];

export function logError(category: LogCategory, error: unknown, message = "오류가 발생했어요.") {
  const detail = error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error);
  const log = addLog({ level: "error", category, message, detail });
  if (process.env.NODE_ENV !== "production") console.error(`[${category}] ${message}`, error);
  return log;
}

export function logInfo(category: LogCategory, message: string, detail?: string) {
  return addLog({ level: "info", category, message, detail });
}

export function getRecentLogs(limit = 20) {
  return memoryLogs.slice(0, limit);
}

function addLog(input: Omit<AppLog, "id" | "createdAt">) {
  const log: AppLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...input,
  };
  memoryLogs.unshift(log);
  memoryLogs.splice(50);
  return log;
}
