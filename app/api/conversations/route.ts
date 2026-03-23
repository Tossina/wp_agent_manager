import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { siteId } = await req.json();

  const site = await prisma.site.findFirst({
    where: { id: siteId, userId: session.user.id },
  });
  if (!site) {
    return NextResponse.json({ error: "Site introuvable" }, { status: 404 });
  }

  const conversation = await prisma.conversation.create({
    data: {
      userId: session.user.id,
      siteId,
      title: "Nouvelle conversation",
    },
  });

  return NextResponse.json({ conversation }, { status: 201 });
}
