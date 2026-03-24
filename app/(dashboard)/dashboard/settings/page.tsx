import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Settings, Key, User, Bell, Brain } from "lucide-react";

const aiProviders = [
  {
    name: "Anthropic (Claude)",
    env: "ANTHROPIC_API_KEY",
    model: "claude-sonnet-4-20250514",
    color: "text-orange-400",
    dot: "bg-orange-400",
    configured: !!process.env.ANTHROPIC_API_KEY,
  },
  {
    name: "Google (Gemini)",
    env: "GEMINI_API_KEY",
    model: "gemini-2.5-flash",
    color: "text-blue-400",
    dot: "bg-blue-400",
    configured: !!process.env.GEMINI_API_KEY,
  },
  {
    name: "OpenAI (GPT-4o)",
    env: "OPENAI_API_KEY",
    model: "gpt-4o",
    color: "text-emerald-400",
    dot: "bg-emerald-400",
    configured: !!process.env.OPENAI_API_KEY,
  },
];

const activeProvider = process.env.AI_PROVIDER || (
  process.env.GEMINI_API_KEY ? "gemini" :
  process.env.OPENAI_API_KEY ? "openai" :
  process.env.ANTHROPIC_API_KEY ? "anthropic" : null
);

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>

      <div className="space-y-4">
        {/* Profile */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold">Profil</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Nom</span>
              <span className="font-medium">{session.user.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{session.user.email}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium capitalize">{(session.user as any).plan || "free"}</span>
            </div>
          </div>
        </div>

        {/* AI Providers */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold">Fournisseurs IA</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            WP_MNGR détecte automatiquement le fournisseur actif selon les clés configurées dans{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded">.env.local</code>.
            Utilisez <code className="bg-muted px-1.5 py-0.5 rounded">AI_PROVIDER=gemini|openai|anthropic</code> pour forcer un choix.
          </p>

          <div className="space-y-3">
            {aiProviders.map((p) => {
              const isActive =
                activeProvider === p.env.replace("_API_KEY", "").toLowerCase();
              return (
                <div
                  key={p.env}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? "border-green-500/40 bg-green-500/5"
                      : "border-border bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.configured ? p.dot : "bg-muted-foreground/30"}`} />
                    <div>
                      <span className={`font-medium ${p.configured ? p.color : "text-muted-foreground"}`}>
                        {p.name}
                      </span>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        <code className="bg-muted px-1 py-0.5 rounded">{p.env}</code>
                        {" · "}
                        <span>{p.model}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive && (
                      <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
                        Actif
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      p.configured
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}>
                      {p.configured ? "Configuré" : "Non configuré"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coming soon */}
        <div className="rounded-xl border border-border/50 bg-card/50 p-6 opacity-60">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold">Notifications</h2>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Bientôt</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Recevez des alertes par email pour les actions importantes sur vos sites.
          </p>
        </div>
      </div>
    </div>
  );
}
