"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, CheckCircle2, Globe, Key, Loader2, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { id: 1, title: "Informations du site" },
  { id: 2, title: "Installation du plugin" },
  { id: 3, title: "Connexion" },
];

export default function NewSitePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", apiKey: "" });
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const pluginDownloadUrl = "/wp-mngr-bridge.zip";

  const copyApiKey = () => {
    navigator.clipboard.writeText(form.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/sites/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.url, apiKey: form.apiKey }),
      });
      const data = await res.json();
      setTestResult({
        ok: res.ok,
        message: res.ok
          ? `✅ Connexion réussie ! WordPress ${data.version}`
          : `❌ ${data.error}`,
      });
    } catch {
      setTestResult({ ok: false, message: "❌ Erreur de connexion" });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Erreur", description: data.error });
        return;
      }
      toast({ title: "Site ajouté !", description: "Vous pouvez maintenant gérer votre site avec l'IA." });
      router.push(`/dashboard/sites/${data.site.id}`);
    } catch {
      toast({ variant: "destructive", title: "Erreur serveur" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/dashboard/sites" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour aux sites
      </Link>

      <h1 className="text-2xl font-bold mb-2">Ajouter un site WordPress</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Connectez votre site en 3 étapes simples.
      </p>

      {/* Steps indicator */}
      <div className="flex items-center gap-3 mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step >= s.id
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
              </div>
              <span className={`text-sm hidden sm:block ${step >= s.id ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {s.title}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px flex-1 w-8 ${step > s.id ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-semibold mb-1">Informations du site</h2>
              <p className="text-sm text-muted-foreground">Entrez l&apos;URL et un nom pour identifier votre site.</p>
            </div>
            <div className="space-y-2">
              <Label>Nom du site</Label>
              <Input
                placeholder="Mon site boutique"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>URL du site</Label>
              <Input
                type="url"
                placeholder="https://mon-site.fr"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value.replace(/\/$/, "") })}
              />
            </div>
            <Button
              onClick={() => setStep(2)}
              disabled={!form.name || !form.url}
              className="w-full"
            >
              Continuer
            </Button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-semibold mb-1">Installer le plugin Bridge</h2>
              <p className="text-sm text-muted-foreground">
                Téléchargez et installez le plugin WP_MNGR Bridge sur votre site WordPress.
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-3">
              {[
                "Téléchargez le plugin ci-dessous",
                "Allez dans WordPress → Extensions → Ajouter",
                "Cliquez sur 'Téléverser une extension'",
                "Sélectionnez le fichier .zip téléchargé",
                "Installez et activez le plugin",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                    {i + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <a href={pluginDownloadUrl} download>
                <Button variant="outline" className="gap-2">
                  <Key className="w-4 h-4" />
                  Télécharger le plugin
                </Button>
              </a>
              <a
                href={`${form.url}/wp-admin/plugin-install.php`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" className="gap-2">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Ouvrir WordPress Admin
                </Button>
              </a>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Retour
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Plugin installé →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-semibold mb-1">Connecter le site</h2>
              <p className="text-sm text-muted-foreground">
                Dans votre admin WordPress, allez dans <strong>WP_MNGR → Clé API</strong> et copiez la clé générée.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Clé API WordPress</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="wpa_xxxxxxxxxxxxxxxx"
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  className="font-mono text-sm"
                />
                {form.apiKey && (
                  <Button variant="outline" size="icon" onClick={copyApiKey}>
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                )}
              </div>
            </div>

            {form.apiKey && (
              <Button
                variant="outline"
                onClick={testConnection}
                disabled={testing}
                className="w-full"
              >
                {testing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Test en cours...</>
                ) : (
                  "Tester la connexion"
                )}
              </Button>
            )}

            {testResult && (
              <div
                className={`text-sm p-3 rounded-lg ${
                  testResult.ok
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {testResult.message}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Retour
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!form.apiKey || loading}
                className="flex-1"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connexion...</>
                ) : (
                  "Connecter le site"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
