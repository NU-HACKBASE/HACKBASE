import { env } from "../config/env.js";

export type GenerateTextInput = {
  prompt: string;
};

export type RoomAnalysisInput = {
  roomTitle: string;
  chats: Array<{
    userName: string;
    body: string;
    likedCount: number;
    createdAt: string;
  }>;
};

export type RoomAnalysisResult = {
  heat: number;
  summary: string;
  trends: string[];
};

type AiServiceOptions = {
  apiKey?: string;
  model?: string;
  apiBaseUrl?: string;
  fetchImpl?: typeof fetch;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

export class AiService {
  private readonly apiKey?: string;
  private readonly model: string;
  private readonly apiBaseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: AiServiceOptions = {}) {
    this.apiKey = options.apiKey ?? env.googleAiApiKey;
    this.model = options.model ?? env.googleAiModel;
    this.apiBaseUrl = options.apiBaseUrl ?? env.googleAiApiBaseUrl;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async generateText(input: GenerateTextInput): Promise<string> {
    if (!this.apiKey) {
      throw new Error("GOOGLE_AI_API_KEY is required to use AI analysis");
    }

    const response = await this.fetchImpl(
      `${this.apiBaseUrl}/models/${this.model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: input.prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!response.ok) {
      const details = await response.text();
      throw new Error(
        `Google AI request failed: ${response.status} ${details}`,
      );
    }

    const data = (await response.json()) as GeminiGenerateContentResponse;
    const text = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join("")
      .trim();

    if (!text) {
      throw new Error("Google AI response did not include text");
    }

    return text;
  }

  async analyzeRoom(input: RoomAnalysisInput): Promise<RoomAnalysisResult> {
    if (input.chats.length === 0) {
      return {
        heat: 0,
        summary: "まだチャットがありません。",
        trends: [],
      };
    }

    const text = await this.generateText({
      prompt: buildRoomAnalysisPrompt(input),
    });
    const parsed = parseJsonObject(text);

    return normalizeRoomAnalysis(parsed);
  }
}

const buildRoomAnalysisPrompt = (input: RoomAnalysisInput) => {
  const chats = input.chats.map((chat, index) => ({
    index: index + 1,
    userName: chat.userName,
    body: chat.body,
    likedCount: chat.likedCount,
    createdAt: chat.createdAt,
  }));

  return [
    "あなたはイベント会場チャットの分析係です。",
    "チャット本文、いいね数、会話量から、会場の盛り上がり判定と短い要約を作ってください。",
    "必ず次の JSON だけを返してください。説明文や Markdown は不要です。",
    '{"heat": number, "summary": string, "trends": string[]}',
    "条件:",
    "- heat は 0 から 100 の整数。発言量、いいね、熱量、現地感、参加したくなる雰囲気を総合してください。",
    "- summary は日本語で 80 文字以内。今どんな話題がでているかを端的にまとめて教えてください。なお、チャット数が少ない場合に、チャットの内容を並べることはしないで下さい。",
    "- trends は日本語の短いキーワードを最大 3 件。",
    "",
    `ルーム名: ${input.roomTitle}`,
    `チャット: ${JSON.stringify(chats)}`,
  ].join("\n");
};

const parseJsonObject = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("AI analysis response was not JSON");
    }

    return JSON.parse(match[0]);
  }
};

const normalizeRoomAnalysis = (value: unknown): RoomAnalysisResult => {
  if (!value || typeof value !== "object") {
    throw new Error("AI analysis response was not an object");
  }

  const source = value as {
    heat?: unknown;
    summary?: unknown;
    trends?: unknown;
  };
  const heat = clampHeat(source.heat);
  const summary =
    typeof source.summary === "string" && source.summary.trim()
      ? source.summary.trim()
      : "話題を分析しました。";
  const trends = Array.isArray(source.trends)
    ? source.trends
        .filter(
          (trend): trend is string =>
            typeof trend === "string" && Boolean(trend.trim()),
        )
        .map((trend) => trend.trim())
        .slice(0, 3)
    : [];

  return {
    heat,
    summary,
    trends,
  };
};

const clampHeat = (value: unknown) => {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numberValue)));
};
