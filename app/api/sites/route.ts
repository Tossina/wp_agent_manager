import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/wordpress";
import { z } from "zod";

const createSiteSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  apiKey: z.string().min(10),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const sites = await prisma.site.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { conversations: true, logs: true } } },
  });

  return NextResponse.json({ sites });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSiteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { name, url, apiKey } = parsed.data;

  // Vérifier la limite selon le plan
  const siteCount = await prisma.site.count({ where: { userId: session.user.id } });
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const limit = user?.plan === "agency" ? 50 : user?.plan === "solo" ? 5 : 1;

  if (siteCount >= limit) {
    return NextResponse.json(
      { error: `Limite de ${limit} site(s) atteinte pour votre plan.` },
      { status: 403 }
    );
  }

  // Normaliser l'URL (supprimer le slash final)
  const normalizedUrl = url.replace(/\/$/, "");

  // Vérifier si le site existe déjà
  const existing = await prisma.site.findFirst({
    where: { url: normalizedUrl, userId: session.user.id },
  });
  if (existing) {
    return NextResponse.json({ error: "Ce site est déjà connecté." }, { status: 409 });
  }

  const site = await prisma.site.create({
    data: {
      userId: session.user.id,
      name,
      url: normalizedUrl,
      apiKey,
    },
  });

  return NextResponse.json({ site }, { status: 201 });
}
