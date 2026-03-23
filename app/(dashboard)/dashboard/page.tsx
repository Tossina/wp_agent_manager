import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Globe,
  MessageSquare,
  Activity,
  Plus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  ShoppingCart,
  Shield,
  Gauge,
  Palette,
  Users,
  Search,
  Wrench,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "@/lib/utils";

const quickCommands = [
  {
    icon: ShoppingCart,
    label: "WooCommerce",
    commands: [
      "Configure WooCommerce pour la France",
      "Montre les 10 dernières commandes",
      "Crée un code promo -20%",
    ],
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  {
    icon: Palette,
    label: "Builders",
    commands: [
      "Configure mon site pour Elementor",
      "Installe le thème Astra",
      "Liste tous les thèmes installés",
    ],
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
  },
  {
    icon: Shield,
    label: "Sécurité",
    commands: [
      "Sécurise mon site WordPress",
      "Configure une sauvegarde auto",
      "Fais un audit de sécurité",
    ],
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  {
    icon: Gauge,
    label: "Performance",
    commands: [
      "Installe et configure le cache",
      "Optimise la base de données",
      "Vide le cache du site",
    ],
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  {
    icon: Search,
    label: "SEO",
    commands: [
      "Configure Yoast SEO",
      "Configure les permalinks",
      "Fais un audit complet",
    ],
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  {
    icon: Wrench,
    label: "Maintenance",
    commands: [
      "Mets à jour tous les plugins",
      "Supprime les plugins inactifs",
      "Change le titre du site",
    ],
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [sites, totalLogs, recentLogs, conversations] = await Promise.all([
    prisma.site.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.actionLog.count({
      where: { site: { userId: session.user.id } },
    }),
    prisma.actionLog.findMany({
      where: { site: { userId: session.user.id } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { site: { select: { name: true } } },
    }),
    prisma.conversation.count({
      where: { userId: session.user.id },
    }),
  ]);

  const activeSites = sites.filter((s) => s.isActive).length;
  const successLogs = recentLogs.filter((l) => l.status === "success").length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Bonjour, {session.user.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Voici un aperçu de vos sites WordPress
          </p>
        </div>
        <Link href="/dashboard/sites/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Ajouter un site
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Sites connectés",
            value: activeSites,
            total: sites.length,
            icon: Globe,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            label: "Conversations IA",
            value: conversations,
            icon: MessageSquare,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
          },
          {
            label: "Actions effectuées",
            value: totalLogs,
            icon: Activity,
            color: "text-green-400",
            bg: "bg-green-500/10",
          },
          {
            label: "Taux de succès",
            value: recentLogs.length > 0 ? `${Math.round((successLogs / recentLogs.length) * 100)}%` : "—",
            icon: CheckCircle2,
            color: "text-orange-400",
            bg: "bg-orange-500/10",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Quick Commands */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-green-400" />
            <h2 className="font-semibold">Commandes rapides</h2>
          </div>
          <span className="text-xs text-muted-foreground">Cliquez sur un site et collez dans le chat</span>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickCommands.map((cat) => (
            <div key={cat.label} className={`rounded-lg border ${cat.border} ${cat.bg} p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <cat.icon className={`w-4 h-4 ${cat.color}`} />
                <span className="text-sm font-semibold">{cat.label}</span>
              </div>
              <div className="space-y-1.5">
                {cat.commands.map((cmd) => (
                  <div
                    key={cmd}
                    className="text-xs text-muted-foreground bg-background/50 rounded px-2.5 py-1.5 cursor-default hover:text-foreground transition-colors"
                    title={cmd}
                  >
                    &quot;{cmd}&quot;
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sites */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-semibold">Mes sites WordPress</h2>
            <Link href="/dashboard/sites">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          <div className="p-5">
            {sites.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Aucun site connecté
                </p>
                <Link href="/dashboard/sites/new">
                  <Button size="sm" variant="outline" className="gap-2">
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter votre premier site
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {sites.slice(0, 5).map((site) => (
                  <Link
                    key={site.id}
                    href={`/dashboard/sites/${site.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          site.isActive ? "bg-green-400" : "bg-red-400"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium">{site.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {site.url.replace(/^https?:\/\//, "")}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity log */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-semibold">Activité récente</h2>
            <Link href="/dashboard/logs">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          <div className="p-5">
            {recentLogs.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Aucune action effectuée
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    {log.status === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    ) : log.status === "error" ? (
                      <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {log.action.replace(/_/g, " ")}
                        {log.target && <span className="text-muted-foreground"> — {log.target}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.site.name} · {formatDistanceToNow(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
