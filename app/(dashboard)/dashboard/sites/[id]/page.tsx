import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SiteChatPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const site = await prisma.site.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!site) notFound();

  // Charger les conversations existantes
  const conversations = await prisma.conversation.findMany({
    where: { siteId: site.id, userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 1 },
    },
  });

  return (
    <ChatInterface
      site={{
        id: site.id,
        name: site.name,
        url: site.url,
      }}
      conversations={conversations.map((c) => ({
        id: c.id,
        title: c.title,
        updatedAt: c.updatedAt.toISOString(),
        preview: c.messages[0]?.content.slice(0, 60) || "",
      }))}
    />
  );
}
