import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Types unifiés ─────────────────────────────────────────

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIResponse {
  text: string | null;
  toolCalls: ToolCall[];
  stopReason: "end" | "tool_use";
}

// ─── Interface Provider ────────────────────────────────────

export interface AIProvider {
  name: string;
  chat(
    messages: AIMessage[],
    tools: ToolDefinition[],
    systemPrompt: string
  ): Promise<AIResponse>;

  continueWithToolResults(
    messages: AIMessage[],
    tools: ToolDefinition[],
    systemPrompt: string,
    previousResponse: unknown,
    toolResults: { toolCallId: string; result: string }[]
  ): Promise<AIResponse>;
}

// ─── Anthropic Provider ────────────────────────────────────

class AnthropicProvider implements AIProvider {
  name = "Anthropic (Claude)";
  private client: Anthropic;
  private model = "claude-sonnet-4-20250514";

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async chat(messages: AIMessage[], tools: ToolDefinition[], systemPrompt: string): Promise<AIResponse> {
    const anthropicTools: Anthropic.Tool[] = tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters as Anthropic.Tool["input_schema"],
    }));

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt,
      tools: anthropicTools,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    return this.parseResponse(response);
  }

  async continueWithToolResults(
    messages: AIMessage[],
    tools: ToolDefinition[],
    systemPrompt: string,
    _previousResponse: unknown,
    toolResults: { toolCallId: string; result: string }[]
  ): Promise<AIResponse> {
    const anthropicTools: Anthropic.Tool[] = tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters as Anthropic.Tool["input_schema"],
    }));

    // Build full message history with tool results
    const fullMessages = [
      ...messages,
      {
        role: "user" as const,
        content: JSON.stringify(
          toolResults.map((tr) => ({
            type: "tool_result",
            tool_use_id: tr.toolCallId,
            content: tr.result,
          }))
        ),
      },
    ];

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt,
      tools: anthropicTools,
      messages: fullMessages.map((m) => ({ role: m.role, content: m.content })),
    });

    return this.parseResponse(response);
  }

  private parseResponse(response: Anthropic.Message): AIResponse {
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as Anthropic.TextBlock).text)
      .join("\n") || null;

    const toolCalls: ToolCall[] = response.content
      .filter((b) => b.type === "tool_use")
      .map((b) => {
        const block = b as Anthropic.ToolUseBlock;
        return {
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        };
      });

    return {
      text,
      toolCalls,
      stopReason: response.stop_reason === "tool_use" ? "tool_use" : "end",
    };
  }
}

// ─── OpenAI Provider ───────────────────────────────────────

class OpenAIProvider implements AIProvider {
  name = "OpenAI (GPT-4o)";
  private client: OpenAI;
  private model = "gpt-4o";

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async chat(messages: AIMessage[], tools: ToolDefinition[], systemPrompt: string): Promise<AIResponse> {
    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const openaiTools: OpenAI.Chat.Completions.ChatCompletionTool[] = tools.map((t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: openaiMessages,
      tools: openaiTools,
      max_tokens: 4096,
    });

    return this.parseResponse(response);
  }

  async continueWithToolResults(
    messages: AIMessage[],
    tools: ToolDefinition[],
    systemPrompt: string,
    previousResponse: unknown,
    toolResults: { toolCallId: string; result: string }[]
  ): Promise<AIResponse> {
    const prevChoice = (previousResponse as OpenAI.Chat.Completions.ChatCompletion).choices[0];

    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      // Add the assistant's tool call message
      prevChoice.message as OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam,
      // Add tool results
      ...toolResults.map((tr) => ({
        role: "tool" as const,
        tool_call_id: tr.toolCallId,
        content: tr.result,
      })),
    ];

    const openaiTools: OpenAI.Chat.Completions.ChatCompletionTool[] = tools.map((t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: openaiMessages,
      tools: openaiTools,
      max_tokens: 4096,
    });

    return this.parseResponse(response);
  }

  private parseResponse(response: OpenAI.Chat.Completions.ChatCompletion): AIResponse {
    const choice = response.choices[0];
    const toolCalls: ToolCall[] = (choice.message.tool_calls || []).map((tc: any) => ({
      id: tc.id,
      name: tc.function.name,
      input: JSON.parse(tc.function.arguments || "{}"),
    }));

    return {
      text: choice.message.content,
      toolCalls,
      stopReason: choice.finish_reason === "tool_calls" ? "tool_use" : "end",
      _raw: response,
    } as AIResponse & { _raw: unknown };
  }
}

// ─── Gemini Provider ───────────────────────────────────────

class GeminiProvider implements AIProvider {
  name = "Google (Gemini)";
  private client: GoogleGenerativeAI;
  private model = "gemini-2.5-flash";

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  }

  private convertSchemaType(type: string): string {
    const map: Record<string, string> = {
      string: "STRING",
      number: "NUMBER",
      boolean: "BOOLEAN",
      object: "OBJECT",
      array: "ARRAY",
    };
    return map[type] || "STRING";
  }

  private convertProperties(props: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(props)) {
      result[key] = {
        type: this.convertSchemaType(value.type),
        description: value.description || "",
        ...(value.enum ? { enum: value.enum } : {}),
        ...(value.items ? { items: { type: this.convertSchemaType(value.items.type) } } : {}),
      };
    }
    return result;
  }

  async chat(messages: AIMessage[], tools: ToolDefinition[], systemPrompt: string): Promise<AIResponse> {
    const geminiTools = [{
      functionDeclarations: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: {
          type: "OBJECT" as any,
          properties: this.convertProperties((t.parameters as any).properties || {}),
          required: (t.parameters as any).required || [],
        },
      })),
    }];

    const model = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
      tools: geminiTools,
    });

    const geminiHistory = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history: geminiHistory as any });
    const lastMessage = messages[messages.length - 1]?.content || "";
    const result = await chat.sendMessage(lastMessage);

    return this.parseResponse(result);
  }

  async continueWithToolResults(
    messages: AIMessage[],
    tools: ToolDefinition[],
    systemPrompt: string,
    _previousResponse: unknown,
    toolResults: { toolCallId: string; result: string }[]
  ): Promise<AIResponse> {
    const geminiTools = [{
      functionDeclarations: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: {
          type: "OBJECT" as any,
          properties: this.convertProperties((t.parameters as any).properties || {}),
          required: (t.parameters as any).required || [],
        },
      })),
    }];

    const model = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
      tools: geminiTools,
    });

    // Build history including tool call/response
    const geminiHistory = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history: geminiHistory as any });

    // Send tool results as function responses
    const functionResponses = toolResults.map((tr) => ({
      functionResponse: {
        name: tr.toolCallId, // Gemini uses function name, not ID
        response: JSON.parse(tr.result),
      },
    }));

    const result = await chat.sendMessage(functionResponses as any);
    return this.parseResponse(result);
  }

  private parseResponse(result: any): AIResponse {
    const response = result.response;
    const candidates = response.candidates || [];
    const parts = candidates[0]?.content?.parts || [];

    const textParts = parts.filter((p: any) => p.text);
    const functionParts = parts.filter((p: any) => p.functionCall);

    const text = textParts.map((p: any) => p.text).join("\n") || null;
    const toolCalls: ToolCall[] = functionParts.map((p: any, i: number) => ({
      id: p.functionCall.name + "_" + i,
      name: p.functionCall.name,
      input: p.functionCall.args || {},
    }));

    return {
      text,
      toolCalls,
      stopReason: toolCalls.length > 0 ? "tool_use" : "end",
    };
  }
}

// ─── Factory ───────────────────────────────────────────────

export type ProviderName = "anthropic" | "openai" | "gemini";

export function getProvider(name?: ProviderName): AIProvider {
  // Explicit choice
  if (name === "anthropic" && process.env.ANTHROPIC_API_KEY) return new AnthropicProvider();
  if (name === "openai" && process.env.OPENAI_API_KEY) return new OpenAIProvider();
  if (name === "gemini" && process.env.GEMINI_API_KEY) return new GeminiProvider();

  // Auto-detect from env
  const envProvider = process.env.AI_PROVIDER as ProviderName | undefined;
  if (envProvider) return getProvider(envProvider);

  // Fallback: first available key
  if (process.env.GEMINI_API_KEY) return new GeminiProvider();
  if (process.env.OPENAI_API_KEY) return new OpenAIProvider();
  if (process.env.ANTHROPIC_API_KEY) return new AnthropicProvider();

  throw new Error("Aucune clé API IA configurée. Ajoutez GEMINI_API_KEY, OPENAI_API_KEY ou ANTHROPIC_API_KEY dans .env.local");
}

export function getAvailableProviders(): { name: ProviderName; label: string; available: boolean }[] {
  return [
    { name: "gemini", label: "Google (Gemini)", available: !!process.env.GEMINI_API_KEY },
    { name: "openai", label: "OpenAI (GPT-4o)", available: !!process.env.OPENAI_API_KEY },
    { name: "anthropic", label: "Anthropic (Claude)", available: !!process.env.ANTHROPIC_API_KEY },
  ];
}
