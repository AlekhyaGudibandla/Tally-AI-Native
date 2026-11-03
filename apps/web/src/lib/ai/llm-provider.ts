import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

export class ProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderConfigurationError";
  }
}

export class ProviderExecutionError extends Error {
  public statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "ProviderExecutionError";
    this.statusCode = statusCode;
  }
}

export interface ModelProviderOptions {
  modelName?: string;
  temperature?: number;
  timeout?: number;
  maxRetries?: number;
}

let mockModelInstance: any = null;

/**
 * Configure a mock model instance for deterministic integration tests.
 */
export const setMockModel = (mock: any) => {
  mockModelInstance = mock;
};

/**
 * Clear any active mock model instance, restoring real Groq provider invocation.
 */
export const clearMockModel = () => {
  mockModelInstance = null;
};

/**
 * Check if a mock model is currently registered.
 */
export const isMockModelActive = (): boolean => {
  return mockModelInstance !== null;
};

/**
 * Ensures environment variables from .env are loaded into process.env if not already present.
 */
export const ensureEnvLoaded = (): string | null => {
  if (process.env.GROQ_API_KEY === "") {
    return null;
  }
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "your-groq-api-key-here") {
    return "already_loaded";
  }

  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "apps/web/.env"),
    path.resolve(__dirname, "../../../.env"),
    path.resolve(__dirname, "../../.env"),
    path.resolve(__dirname, ".env"),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p, override: true });
      if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "your-groq-api-key-here") {
        return p;
      }
    }
  }

  return null;
};

// Auto-run on import
ensureEnvLoaded();

/**
 * Return current configured model name.
 */
export const getConfiguredModelName = (): string => {
  ensureEnvLoaded();
  return process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
};

/**
 * Retrieve the configured Groq LLM instance with robust timeouts and retry limits.
 * In test mode (when mock model is set), returns the mock model.
 * In live mode, validates GROQ_API_KEY and returns configured ChatGroq instance.
 */
export const getModel = (options: string | ModelProviderOptions = {}): any => {
  if (mockModelInstance) {
    return mockModelInstance;
  }

  ensureEnvLoaded();

  const modelName =
    typeof options === "string"
      ? options
      : options.modelName || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const temperature =
    typeof options === "object" && options.temperature !== undefined ? options.temperature : 0;
  const timeout =
    typeof options === "object" && options.timeout !== undefined ? options.timeout : 30000;
  const maxRetries =
    typeof options === "object" && options.maxRetries !== undefined ? options.maxRetries : 2;

  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey || apiKey === "your-groq-api-key-here" || apiKey.includes("your-groq")) {
    throw new ProviderConfigurationError(
      "GROQ_API_KEY is missing or contains placeholder. Please configure a free GROQ_API_KEY from https://console.groq.com/keys in apps/web/.env."
    );
  }

  return new ChatGroq({
    apiKey,
    model: modelName,
    temperature,
    timeout,
    maxRetries,
  });
};
