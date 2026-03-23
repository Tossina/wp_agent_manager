import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProvider } from "@/lib/ai-provider";
import { wpTools, SYSTEM_PROMPT } from "@/lib/ai-config";
import { executeWPTool } from "@/lib/wordpress";
import { z } from "zod";

const chatSchema = z.object({
  siteId: z.string(),
  conversationId: z.string(),
  message: z.string().min(1).max(4000),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const { siteId, conversationId, message } = parsed.data;

    // Vérifier que le site appartient à l'utilisateur
    const site = await prisma.site.findFirst({
      where: { id: siteId, userId: session.user.id },
    });
    if (!site) {
      return NextResponse.json({ error: "Site introuvable" }, { status: 404 });
    }

    // Vérifier que la conversation appartient à l'utilisateur
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: session.user.id, siteId },
    });
    if (!conversation) {
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    }

    // Sauvegarder le message utilisateur
    await prisma.message.create({
      data: { conversationId, role: "user", content: message },
    });

    // Récupérer l'historique de la conversation
    const history = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    // Construire les messages
    const aiMessages = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Contexte du site dans le prompt système
    const siteContext = `\n\n## Site WordPress actuel\n- Nom : ${site.name}\n- URL : ${site.url}\n- ID : ${site.id}`;
    const fullSystemPrompt = SYSTEM_PROMPT + siteContext;

    // Obtenir le provider IA
    const provider = getProvider();
    console.log(`[CHAT] Using AI provider: ${provider.name}`);

    let finalResponse = "";
    let updatedTitle: string | null = null;

    // Agentic loop — le provider appelle les outils en boucle
    let iterations = 0;
    const maxIterations = 10;
    let currentMessages = aiMessages;
    let lastRawResponse: unknown = null;

    while (iterations < maxIterations) {
      iterations++;

      let response;
      if (iterations === 1 || !lastRawResponse) {
        response = await provider.chat(currentMessages, wpTools, fullSystemPrompt);
      } else {
        // Continue with tool results — shouldn't happen as we rebuild messages below
        response = await provider.chat(currentMessages, wpTools, fullSystemPrompt);
      }

      if (response.stopReason === "end") {
        finalResponse = response.text || "";
        break;
      }

      if (response.stopReason === "tool_use" && response.toolCalls.length > 0) {
        const toolResults: { toolCallId: string; result: string }[] = [];
        const logEntries: { action: string; target?: string; status: string; details?: string }[] = [];

        for (const toolCall of response.toolCalls) {
          const result = await executeWPTool(
            { id: site.id, url: site.url, apiKey: site.apiKey },
            toolCall.name,
            toolCall.input
          );

          toolResults.push({
            toolCallId: toolCall.id,
            result,
          });

          logEntries.push({
            action: toolCall.name,
            target: (toolCall.input.slug || toolCall.input.name || toolCall.input.type) as string | undefined,
            status: result.startsWith("❌") ? "error" : "success",
            details: result.slice(0, 500),
          });
        }

        // Log actions
        await prisma.actionLog.createMany({
          data: logEntries.map((log) => ({ ...log, siteId })),
        });

        // Add assistant response and tool results to message history
        const assistantContent = response.text
          ? response.text + "\n\n[Tool calls: " + response.toolCalls.map(tc => tc.name).join(", ") + "]"
          : "[Tool calls: " + response.toolCalls.map(tc => tc.name).join(", ") + "]";

        currentMessages = [
          ...currentMessages,
          { role: "assistant" as const, content: assistantContent },
          {
            role: "user" as const,
            content: "Résultats des outils:\n" + toolResults.map(
              (tr) => `${tr.toolCallId}: ${tr.result}`
            ).join("\n\n"),
          },
        ];
      } else {
        break;
      }
    }

    if (!finalResponse) {
      finalResponse = "Je n'ai pas pu générer une réponse. Veuillez réessayer.";
    }

    // Sauvegarder la réponse de l'assistant
    await prisma.message.create({
      data: { conversationId, role: "assistant", content: finalResponse },
    });

    // Mettre à jour le titre de la conversation si c'est le 2ème message
    if (history.length === 1) {
      try {
        const titleProvider = getProvider();
        const titleRes = await titleProvider.chat(
          [
            {
              role: "user",
              content: `Génère un titre très court (max 6 mots) en français pour cette conversation qui commence par: "${message}". Réponds uniquement avec le titre, sans guillemets ni ponctuation.`,
            },
          ],
          [], // no tools needed
          "Tu génères des titres courts.",
        );
        updatedTitle = titleRes.text?.trim() || null;
      } catch {
        updatedTitle = message.slice(0, 40);
      }

      if (updatedTitle) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { title: updatedTitle, updatedAt: new Date() },
        });
      }
    } else {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    }

    return NextResponse.json({
      response: finalResponse,
      title: updatedTitle,
    });
  } catch (error) {
    console.error("[CHAT] Error details:", error instanceof Error ? { message: error.message, stack: error.stack } : error);
    const errorMessage = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
