import crypto from "crypto";

export interface WPSite {
  id: string;
  url: string;
  apiKey: string;
}

// Génère la signature HMAC-SHA256 pour sécuriser les requêtes
function generateHmacSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

// Client pour appeler l'API du plugin WP_MNGR Bridge
export async function callWPBridge(
  site: WPSite,
  action: string,
  params: Record<string, unknown> = {}
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const timestamp = Date.now().toString();
  const body = JSON.stringify({ action, params, timestamp });
  const signature = generateHmacSignature(body, site.apiKey);

  try {
    const response = await fetch(`${site.url}/wp-json/wp-agent/v1/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-WP-Agent-Key": site.apiKey,
        "X-WP-Agent-Signature": signature,
        "X-WP-Agent-Timestamp": timestamp,
      },
      body,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "TimeoutError") {
        return { success: false, error: "Délai d'attente dépassé. Vérifiez que le site est accessible." };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erreur inconnue" };
  }
}

// Mapper les appels d'outils Claude vers les actions WordPress
export async function executeWPTool(
  site: WPSite,
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<string> {
  const result = await callWPBridge(site, toolName, toolInput);

  if (!result.success) {
    return `❌ Erreur: ${result.error}`;
  }

  return JSON.stringify(result.data, null, 2);
}

// Vérifier la connexion au site WordPress
export async function testWPConnection(
  url: string,
  apiKey: string
): Promise<{ connected: boolean; version?: string; error?: string }> {
  const site: WPSite = { id: "test", url, apiKey };
  const result = await callWPBridge(site, "wp_get_site_info", {});

  if (!result.success) {
    return { connected: false, error: result.error };
  }

  const data = result.data as any;
  return {
    connected: true,
    version: data?.version,
  };
}

// Générer une clé API sécurisée
export function generateApiKey(): string {
  return `wpa_${crypto.randomBytes(32).toString("hex")}`;
}
