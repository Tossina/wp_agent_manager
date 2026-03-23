import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CheckCircle2, XCircle, Clock, Activity } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

export default async function LogsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const logs = await prisma.actionLog.findMany({
    where: { site: { userId: session.user.id } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { site: { select: { name: true, url: true } } },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Journal d&apos;activité</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Historique de toutes les actions effectuées sur vos sites
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Activity className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Aucune activité</h2>
          <p className="text-muted-foreground text-sm">
            Les actions effectuées sur vos sites apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-0">
            <div className="contents text-xs font-medium text-muted-foreground bg-muted/30 border-b border-border">
              <div className="px-4 py-3">Statut</div>
              <div className="px-4 py-3">Action</div>
              <div className="px-4 py-3">Site</div>
              <div className="px-4 py-3">Date</div>
            </div>
            {logs.map((log, i) => (
              <div
                key={log.id}
                className={`contents text-sm ${i < logs.length - 1 ? "border-b border-border" : ""}`}
              >
                <div className="px-4 py-3 flex items-center">
                  {log.status === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : log.status === "error" ? (
                    <XCircle className="w-4 h-4 text-red-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-yellow-400" />
                  )}
                </div>
                <div className="px-4 py-3">
                  <p className="font-medium">{log.action.replace(/_/g, " ")}</p>
                  {log.target && (
                    <p className="text-xs text-muted-foreground mt-0.5">{log.target}</p>
                  )}
                </div>
                <div className="px-4 py-3 text-muted-foreground text-xs">
                  {log.site.name}
                </div>
                <div className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                  {formatDistanceToNow(log.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
