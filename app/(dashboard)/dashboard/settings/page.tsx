import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Settings, Key, User, Bell } from "lucide-react";

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

        {/* API Keys info */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold">Clé API Claude</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            La clé API Claude est configurée via la variable d&apos;environnement{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">ANTHROPIC_API_KEY</code>{" "}
            dans votre fichier <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.env.local</code>.
          </p>
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
