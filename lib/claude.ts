import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const CLAUDE_MODEL = "claude-sonnet-4-20250514";

// Outils disponibles pour l'agent WordPress
export const wpTools: Anthropic.Tool[] = [
  {
    name: "wp_list_plugins",
    description: "Liste tous les plugins WordPress installés avec leur statut (actif/inactif) et les mises à jour disponibles.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["all", "active", "inactive"],
          description: "Filtrer par statut du plugin",
        },
      },
      required: [],
    },
  },
  {
    name: "wp_install_plugin",
    description: "Installe un plugin WordPress depuis le répertoire officiel.",
    input_schema: {
      type: "object" as const,
      properties: {
        slug: {
          type: "string",
          description: "Le slug du plugin (ex: woocommerce, yoast-seo)",
        },
        activate: {
          type: "boolean",
          description: "Activer le plugin après installation",
          default: true,
        },
      },
      required: ["slug"],
    },
  },
  {
    name: "wp_toggle_plugin",
    description: "Active ou désactive un plugin WordPress.",
    input_schema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "Slug du plugin" },
        action: {
          type: "string",
          enum: ["activate", "deactivate"],
          description: "Action à effectuer",
        },
      },
      required: ["slug", "action"],
    },
  },
  {
    name: "wp_update_plugins",
    description: "Met à jour un ou tous les plugins WordPress.",
    input_schema: {
      type: "object" as const,
      properties: {
        slugs: {
          type: "array",
          items: { type: "string" },
          description: "Liste des slugs à mettre à jour. Vide = tous.",
        },
      },
      required: [],
    },
  },
  {
    name: "wp_create_post",
    description: "Crée un article ou une page WordPress.",
    input_schema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          enum: ["post", "page"],
          description: "Type de contenu",
        },
        title: { type: "string", description: "Titre du contenu" },
        content: { type: "string", description: "Contenu HTML ou texte" },
        status: {
          type: "string",
          enum: ["draft", "publish", "private"],
          default: "draft",
        },
        excerpt: { type: "string", description: "Résumé/extrait" },
        categories: {
          type: "array",
          items: { type: "string" },
          description: "Noms des catégories",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags",
        },
      },
      required: ["type", "title", "content"],
    },
  },
  {
    name: "wp_list_posts",
    description: "Liste les articles ou pages WordPress.",
    input_schema: {
      type: "object" as const,
      properties: {
        type: { type: "string", enum: ["post", "page"], default: "post" },
        status: { type: "string", enum: ["any", "publish", "draft"], default: "any" },
        per_page: { type: "number", default: 10 },
      },
      required: [],
    },
  },
  {
    name: "wc_configure_store",
    description: "Configure les paramètres généraux de la boutique WooCommerce (devise, pays, taxes).",
    input_schema: {
      type: "object" as const,
      properties: {
        currency: { type: "string", description: "Code devise ISO (EUR, USD, GBP...)" },
        country: { type: "string", description: "Code pays ISO (FR, US, GB...)" },
        tax_enabled: { type: "boolean", description: "Activer les taxes" },
        tax_rate: { type: "number", description: "Taux de taxe en pourcentage (ex: 20)" },
        timezone: { type: "string", description: "Fuseau horaire (ex: Europe/Paris)" },
      },
      required: [],
    },
  },
  {
    name: "wc_create_product",
    description: "Crée un produit WooCommerce.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Nom du produit" },
        type: {
          type: "string",
          enum: ["simple", "variable", "grouped", "external"],
          default: "simple",
        },
        price: { type: "string", description: "Prix régulier" },
        sale_price: { type: "string", description: "Prix promo (optionnel)" },
        description: { type: "string", description: "Description du produit" },
        short_description: { type: "string", description: "Description courte" },
        categories: {
          type: "array",
          items: { type: "string" },
          description: "Noms des catégories",
        },
        status: { type: "string", enum: ["draft", "publish"], default: "draft" },
        sku: { type: "string", description: "Référence produit (SKU)" },
        manage_stock: { type: "boolean", default: false },
        stock_quantity: { type: "number", description: "Quantité en stock" },
      },
      required: ["name", "price"],
    },
  },
  {
    name: "wc_list_products",
    description: "Liste les produits WooCommerce.",
    input_schema: {
      type: "object" as const,
      properties: {
        per_page: { type: "number", default: 10 },
        status: { type: "string", enum: ["any", "publish", "draft"], default: "any" },
        category: { type: "string", description: "Filtrer par catégorie" },
      },
      required: [],
    },
  },
  {
    name: "wp_get_site_info",
    description: "Récupère les informations générales du site WordPress (version, plugins actifs, thème, URL, titre).",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "wp_audit",
    description: "Effectue un audit du site WordPress : sécurité, performance, mises à jour, plugins vulnérables.",
    input_schema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          enum: ["full", "security", "performance", "updates"],
          default: "full",
          description: "Type d'audit à effectuer",
        },
      },
      required: [],
    },
  },
];

// Prompt système de l'agent WordPress
export const SYSTEM_PROMPT = `Tu es WP_MNGR, un assistant IA expert en gestion de sites WordPress et WooCommerce.

Tu aides les administrateurs WordPress à gérer leurs sites en utilisant des commandes en langage naturel.
Tu as accès à des outils pour interagir directement avec WordPress via l'API REST sécurisée.

## Règles importantes :
- Toujours confirmer les actions destructives avant de les exécuter
- Signaler clairement quand une action peut avoir des conséquences importantes
- Répondre en français par défaut
- Être concis et précis dans tes réponses
- Formater les listes et résultats de manière claire avec des emojis pertinents
- En cas d'erreur de l'API WordPress, expliquer clairement le problème et proposer des solutions

## Format de réponse :
- Utilise des listes à puces pour les résultats multiples
- Utilise des émojis pour rendre les réponses plus lisibles (✅ succès, ❌ erreur, ⚠️ avertissement, 🔌 plugin, 📝 contenu, 🛒 WooCommerce)
- Indique toujours si une action a réussi ou échoué
- Propose des actions complémentaires pertinentes à la fin de chaque réponse`;
