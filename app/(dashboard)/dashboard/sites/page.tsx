import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Globe, MessageSquare, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "@/lib/utils";

export default async function SitesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const sites = await prisma.site.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { conversations: true, logs: true } },
    },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mes sites WordPress</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {sites.length} site{sites.length > 1 ? "s" : ""} connecté{sites.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/dashboard/sites/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Ajouter un site
          </Button>
        </Link>
      </div>

      {sites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Globe className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Aucun site connecté</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Ajoutez votre premier site WordPress pour commencer à le gérer avec
            l&apos;intelligence artificielle.
          </p>
          <Link href="/dashboard/sites/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Ajouter mon premier site
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <div
              key={site.id}
              className="rounded-xl border border-border bg-card hover:border-primary/50 transition-colors group"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        site.isActive ? "bg-green-400" : "bg-red-400"
                      }`}
                    />
                    <h3 className="font-semibold text-sm">{site.name}</h3>
                  </div>
                  <Badge variant={site.isActive ? "default" : "secondary"} className="text-xs">
                    {site.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </div>

                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                  <ExternalLink className="w-3 h-3" />
                  {site.url.replace(/^https?:\/\//, "")}
                </a>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {site._count.conversations} conv.
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {site._count.logs} actions
                  </span>
                </div>

                {site.lastSync && (
                  <p className="text-xs text-muted-foreground mb-4">
                    Sync : {formatDistanceToNow(site.lastSync)}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 px-5 pb-5">
                <Link href={`/dashboard/sites/${site.id}`} className="flex-1">
                  <Button size="sm" className="w-full gap-2">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Ouvrir le chat
                  </Button>
                </Link>
                <Link href={`/dashboard/sites/${site.id}/settings`}>
                  <Button size="sm" variant="outline">
                    Paramètres
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
