import { ToolDefinition } from "./ai-provider";

// Outils disponibles pour l'agent WordPress (format neutre)
export const wpTools: ToolDefinition[] = [
  // ═══════════════════════════════════════════════════════
  // ─── WordPress Core ─────────────────────────────────
  // ═══════════════════════════════════════════════════════
  {
    name: "wp_get_site_info",
    description: "Récupère les informations générales du site WordPress (version, plugins actifs, thème, URL, titre).",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "wp_list_plugins",
    description: "Liste tous les plugins WordPress installés avec leur statut (actif/inactif) et les mises à jour disponibles.",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["all", "active", "inactive"], description: "Filtrer par statut" },
      },
      required: [],
    },
  },
  {
    name: "wp_install_plugin",
    description: "Installe un plugin WordPress depuis le répertoire officiel.",
    parameters: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Le slug du plugin (ex: woocommerce, yoast-seo)" },
        activate: { type: "boolean", description: "Activer le plugin après installation" },
      },
      required: ["slug"],
    },
  },
  {
    name: "wp_toggle_plugin",
    description: "Active ou désactive un plugin WordPress.",
    parameters: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Slug du plugin" },
        action: { type: "string", enum: ["activate", "deactivate"], description: "Action à effectuer" },
      },
      required: ["slug", "action"],
    },
  },
  {
    name: "wp_update_plugins",
    description: "Met à jour un ou tous les plugins WordPress.",
    parameters: {
      type: "object",
      properties: {
        slugs: { type: "array", items: { type: "string" }, description: "Liste des slugs à mettre à jour. Vide = tous." },
      },
      required: [],
    },
  },
  {
    name: "wp_create_post",
    description: "Crée un article ou une page WordPress.",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["post", "page"], description: "Type de contenu" },
        title: { type: "string", description: "Titre du contenu" },
        content: { type: "string", description: "Contenu HTML ou texte" },
        status: { type: "string", enum: ["draft", "publish", "private"] },
        excerpt: { type: "string", description: "Résumé/extrait" },
        categories: { type: "array", items: { type: "string" }, description: "Noms des catégories" },
        tags: { type: "array", items: { type: "string" }, description: "Tags" },
      },
      required: ["type", "title", "content"],
    },
  },
  {
    name: "wp_list_posts",
    description: "Liste les articles ou pages WordPress.",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["post", "page"] },
        status: { type: "string", enum: ["any", "publish", "draft"] },
        per_page: { type: "number" },
      },
      required: [],
    },
  },
  {
    name: "wp_audit",
    description: "Effectue un audit du site WordPress : sécurité, performance, mises à jour.",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["full", "security", "performance", "updates"], description: "Type d'audit" },
      },
      required: [],
    },
  },

  // ═══════════════════════════════════════════════════════
  // ─── WooCommerce ────────────────────────────────────
  // ═══════════════════════════════════════════════════════
  {
    name: "wc_configure_store",
    description: "Configure les paramètres généraux de la boutique WooCommerce (devise, pays, taxes).",
    parameters: {
      type: "object",
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
    description: "Crée un produit WooCommerce avec prix, description, catégories, SKU et gestion de stock.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nom du produit" },
        price: { type: "string", description: "Prix régulier" },
        sale_price: { type: "string", description: "Prix promo (optionnel)" },
        description: { type: "string", description: "Description du produit" },
        short_description: { type: "string", description: "Description courte" },
        categories: { type: "array", items: { type: "string" }, description: "Noms des catégories" },
        status: { type: "string", enum: ["draft", "publish"] },
        sku: { type: "string", description: "Référence produit (SKU)" },
        manage_stock: { type: "boolean" },
        stock_quantity: { type: "number", description: "Quantité en stock" },
      },
      required: ["name", "price"],
    },
  },
  {
    name: "wc_list_products",
    description: "Liste les produits WooCommerce avec filtres optionnels.",
    parameters: {
      type: "object",
      properties: {
        per_page: { type: "number" },
        status: { type: "string", enum: ["any", "publish", "draft"] },
        category: { type: "string", description: "Filtrer par catégorie" },
      },
      required: [],
    },
  },
  {
    name: "wc_list_orders",
    description: "Liste les commandes WooCommerce avec filtres (statut, nombre).",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["any", "pending", "processing", "on-hold", "completed", "cancelled", "refunded", "failed"], description: "Filtrer par statut" },
        per_page: { type: "number", description: "Nombre de commandes à afficher (max 50)" },
      },
      required: [],
    },
  },
  {
    name: "wc_update_order",
    description: "Met à jour le statut d'une commande WooCommerce ou ajoute une note.",
    parameters: {
      type: "object",
      properties: {
        order_id: { type: "number", description: "ID de la commande" },
        status: { type: "string", enum: ["pending", "processing", "on-hold", "completed", "cancelled", "refunded"], description: "Nouveau statut" },
        note: { type: "string", description: "Note à ajouter à la commande" },
      },
      required: ["order_id"],
    },
  },
  {
    name: "wc_create_coupon",
    description: "Crée un code promo/coupon WooCommerce.",
    parameters: {
      type: "object",
      properties: {
        code: { type: "string", description: "Code du coupon (ex: PROMO2026)" },
        type: { type: "string", enum: ["percent", "fixed_cart", "fixed_product"], description: "Type de réduction" },
        amount: { type: "number", description: "Montant de la réduction" },
        free_shipping: { type: "boolean", description: "Livraison gratuite incluse" },
        expiry_date: { type: "string", description: "Date d'expiration (YYYY-MM-DD)" },
        min_amount: { type: "number", description: "Montant minimum de commande" },
        max_amount: { type: "number", description: "Montant maximum de commande" },
        usage_limit: { type: "number", description: "Nombre max d'utilisations" },
        individual_use: { type: "boolean", description: "Non cumulable avec d'autres coupons" },
      },
      required: ["code", "amount"],
    },
  },
  {
    name: "wc_list_coupons",
    description: "Liste tous les coupons/codes promo WooCommerce actifs.",
    parameters: {
      type: "object",
      properties: {
        per_page: { type: "number", description: "Nombre de coupons à afficher" },
      },
      required: [],
    },
  },
  {
    name: "wc_setup_shipping",
    description: "Configure une zone et méthode de livraison WooCommerce.",
    parameters: {
      type: "object",
      properties: {
        zone_name: { type: "string", description: "Nom de la zone (ex: France, Europe)" },
        country: { type: "string", description: "Code pays ISO (FR, US...)" },
        method: { type: "string", enum: ["flat_rate", "free_shipping", "local_pickup"], description: "Méthode de livraison" },
        cost: { type: "string", description: "Coût de livraison (pour flat_rate)" },
        min_amount: { type: "number", description: "Montant min pour livraison gratuite" },
      },
      required: ["zone_name", "method"],
    },
  },
  {
    name: "wc_list_payment_gateways",
    description: "Liste les passerelles de paiement WooCommerce et permet de les activer/désactiver.",
    parameters: {
      type: "object",
      properties: {
        toggle: { type: "string", enum: ["enable", "disable"], description: "Activer ou désactiver une passerelle" },
        gateway_id: { type: "string", description: "ID de la passerelle (bacs, cod, paypal...)" },
      },
      required: [],
    },
  },
  {
    name: "wc_get_sales_report",
    description: "Génère un rapport de ventes WooCommerce (chiffre d'affaires, commandes, top produits).",
    parameters: {
      type: "object",
      properties: {
        days: { type: "number", description: "Nombre de jours à analyser (défaut: 30)" },
      },
      required: [],
    },
  },

  // ═══════════════════════════════════════════════════════
  // ─── Thèmes & Builders ─────────────────────────────
  // ═══════════════════════════════════════════════════════
  {
    name: "wp_list_themes",
    description: "Liste tous les thèmes WordPress installés avec le thème actif.",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "wp_install_theme",
    description: "Installe un thème WordPress depuis le répertoire officiel.",
    parameters: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Slug du thème (ex: astra, flavor, hello-elementor)" },
        activate: { type: "boolean", description: "Activer le thème après installation" },
      },
      required: ["slug"],
    },
  },
  {
    name: "wp_setup_builder",
    description: "Configure un page builder complet (installe le plugin + thème compatible + plugins compagnons). Supporte: elementor, divi, beaver, bricks, gutenberg.",
    parameters: {
      type: "object",
      properties: {
        builder: { type: "string", enum: ["elementor", "divi", "beaver", "bricks", "gutenberg"], description: "Nom du page builder" },
      },
      required: ["builder"],
    },
  },

  // ═══════════════════════════════════════════════════════
  // ─── SEO ────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════
  {
    name: "wp_setup_seo",
    description: "Installe et configure un plugin SEO (Yoast, RankMath ou AIOSEO) et configure les permalinks.",
    parameters: {
      type: "object",
      properties: {
        plugin: { type: "string", enum: ["yoast", "rankmath", "aioseo"], description: "Plugin SEO à installer" },
      },
      required: [],
    },
  },
  {
    name: "wp_set_meta",
    description: "Modifie le titre SEO et/ou la meta description d'un post ou page.",
    parameters: {
      type: "object",
      properties: {
        post_id: { type: "number", description: "ID du post/page" },
        title: { type: "string", description: "Nouveau titre SEO" },
        description: { type: "string", description: "Nouvelle meta description" },
      },
      required: ["post_id"],
    },
  },
  {
    name: "wp_configure_permalinks",
    description: "Configure la structure des permalinks WordPress.",
    parameters: {
      type: "object",
      properties: {
        structure: { type: "string", description: "Structure (ex: /%postname%/, /%year%/%postname%/)" },
      },
      required: ["structure"],
    },
  },

  // ═══════════════════════════════════════════════════════
  // ─── Sécurité ───────────────────────────────────────
  // ═══════════════════════════════════════════════════════
  {
    name: "wp_setup_security",
    description: "Installe un plugin de sécurité (Wordfence, Sucuri ou iThemes) et renforce la sécurité WordPress.",
    parameters: {
      type: "object",
      properties: {
        plugin: { type: "string", enum: ["wordfence", "sucuri", "ithemes"], description: "Plugin de sécurité" },
      },
      required: [],
    },
  },
  {
    name: "wp_setup_backup",
    description: "Installe UpdraftPlus et configure les sauvegardes automatiques.",
    parameters: {
      type: "object",
      properties: {
        schedule: { type: "string", enum: ["daily", "weekly", "fortnightly", "monthly"], description: "Fréquence de sauvegarde des fichiers" },
      },
      required: [],
    },
  },
  {
    name: "wp_harden",
    description: "Renforce la sécurité WordPress : désactive XML-RPC, file editor, masque version WP, vérifie SSL.",
    parameters: { type: "object", properties: {}, required: [] },
  },

  // ═══════════════════════════════════════════════════════
  // ─── Performance ────────────────────────────────────
  // ═══════════════════════════════════════════════════════
  {
    name: "wp_setup_cache",
    description: "Installe et configure un plugin de cache (LiteSpeed, WP Super Cache, W3TC) + Autoptimize.",
    parameters: {
      type: "object",
      properties: {
        plugin: { type: "string", enum: ["litespeed", "wpsc", "w3tc", "autoptimize"], description: "Plugin de cache" },
      },
      required: [],
    },
  },
  {
    name: "wp_optimize_db",
    description: "Optimise la base de données WordPress : supprime révisions, transients, spam, brouillons auto et optimise les tables.",
    parameters: { type: "object", properties: {}, required: [] },
  },

  // ═══════════════════════════════════════════════════════
  // ─── Utilisateurs ───────────────────────────────────
  // ═══════════════════════════════════════════════════════
  {
    name: "wp_list_users",
    description: "Liste les utilisateurs WordPress avec filtres par rôle.",
    parameters: {
      type: "object",
      properties: {
        role: { type: "string", enum: ["administrator", "editor", "author", "contributor", "subscriber", ""], description: "Filtrer par rôle" },
        per_page: { type: "number", description: "Nombre d'utilisateurs (max 50)" },
      },
      required: [],
    },
  },
  {
    name: "wp_create_user",
    description: "Crée un nouvel utilisateur WordPress.",
    parameters: {
      type: "object",
      properties: {
        username: { type: "string", description: "Nom d'utilisateur" },
        email: { type: "string", description: "Adresse email" },
        role: { type: "string", enum: ["administrator", "editor", "author", "contributor", "subscriber"], description: "Rôle" },
        name: { type: "string", description: "Nom affiché" },
        password: { type: "string", description: "Mot de passe (auto-généré si vide)" },
      },
      required: ["username", "email"],
    },
  },
  {
    name: "wp_manage_user",
    description: "Modifie un utilisateur : changer rôle, réinitialiser mot de passe ou supprimer.",
    parameters: {
      type: "object",
      properties: {
        user_id: { type: "number", description: "ID de l'utilisateur" },
        role: { type: "string", description: "Nouveau rôle" },
        reset_password: { type: "boolean", description: "Réinitialiser le mot de passe" },
        delete: { type: "boolean", description: "Supprimer l'utilisateur" },
      },
      required: ["user_id"],
    },
  },

  // ═══════════════════════════════════════════════════════
  // ─── Médias & Contenu ───────────────────────────────
  // ═══════════════════════════════════════════════════════
  {
    name: "wp_list_media",
    description: "Liste les fichiers médias (images, vidéos, PDF) de la bibliothèque WordPress.",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", description: "Type MIME (image, video, application/pdf)" },
        per_page: { type: "number", description: "Nombre de médias (max 50)" },
      },
      required: [],
    },
  },
  {
    name: "wp_manage_comments",
    description: "Gère les commentaires WordPress : lister, approuver, supprimer spam.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["list", "delete_spam", "approve"], description: "Action" },
        status: { type: "string", enum: ["all", "approve", "hold", "spam", "trash"], description: "Filtrer par statut (pour list)" },
        comment_id: { type: "number", description: "ID du commentaire (pour approve)" },
        per_page: { type: "number" },
      },
      required: ["action"],
    },
  },
  {
    name: "wp_manage_menu",
    description: "Gère les menus de navigation WordPress : lister, créer, ajouter des éléments.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["list", "create", "add_item"], description: "Action" },
        menu_name: { type: "string", description: "Nom du menu (pour create)" },
        menu_id: { type: "number", description: "ID du menu (pour add_item)" },
        title: { type: "string", description: "Titre de l'élément de menu" },
        url: { type: "string", description: "URL personnalisée" },
        page_id: { type: "number", description: "ID de la page à ajouter au menu" },
      },
      required: ["action"],
    },
  },

  // ═══════════════════════════════════════════════════════
  // ─── Maintenance ────────────────────────────────────
  // ═══════════════════════════════════════════════════════
  {
    name: "wp_update_settings",
    description: "Modifie les réglages généraux WordPress (titre, tagline, fuseau, format de date, email admin, inscription).",
    parameters: {
      type: "object",
      properties: {
        site_title: { type: "string", description: "Titre du site" },
        tagline: { type: "string", description: "Slogan/description" },
        timezone: { type: "string", description: "Fuseau horaire (ex: Europe/Paris)" },
        date_format: { type: "string", description: "Format de date" },
        time_format: { type: "string", description: "Format d'heure" },
        language: { type: "string", description: "Langue (ex: fr_FR)" },
        admin_email: { type: "string", description: "Email de l'administrateur" },
        posts_per_page: { type: "number", description: "Articles par page" },
        registration: { type: "boolean", description: "Autoriser l'inscription" },
      },
      required: [],
    },
  },
  {
    name: "wp_bulk_action",
    description: "Exécute des actions en masse : mettre à jour tous les plugins, tous les thèmes, ou supprimer les plugins inactifs.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["update_all_plugins", "update_all_themes", "delete_inactive_plugins"], description: "Action en masse" },
      },
      required: ["action"],
    },
  },
  {
    name: "wp_clear_cache",
    description: "Vide le cache WordPress (WP Super Cache, LiteSpeed, W3TC, Object Cache).",
    parameters: { type: "object", properties: {}, required: [] },
  },
];

// Prompt système de l'agent WordPress
export const SYSTEM_PROMPT = `Tu es WP_MNGR, un assistant IA expert en gestion de sites WordPress et WooCommerce.

Tu aides les administrateurs WordPress à gérer leurs sites en utilisant des commandes en langage naturel.
Tu as accès à des outils pour interagir directement avec WordPress via l'API REST sécurisée.

## Capacités complètes :
- **WordPress** : plugins (installer, activer, MAJ), contenu (posts, pages), thèmes, utilisateurs, médias, commentaires, menus
- **WooCommerce** : produits, commandes, coupons, livraison, paiements, rapports de ventes
- **Builders** : configuration automatique d'Elementor, Divi, Beaver Builder, Bricks, Gutenberg
- **SEO** : installation Yoast/RankMath/AIOSEO, meta tags, permalinks
- **Sécurité** : Wordfence/Sucuri, hardening, backup UpdraftPlus
- **Performance** : cache (LiteSpeed, WPSC, W3TC), optimisation DB
- **Maintenance** : réglages site, actions en masse, purge cache

## Règles importantes :
- Toujours confirmer les actions destructives avant de les exécuter
- Signaler clairement quand une action peut avoir des conséquences importantes
- Répondre en français par défaut
- Être concis et précis dans tes réponses
- Formater les listes et résultats de manière claire avec des emojis pertinents
- En cas d'erreur, expliquer le problème et proposer des solutions
- Pour les commandes complexes type "Configure mon site pour Elementor", chaîner les actions nécessaires

## Format de réponse :
- Utilise des listes à puces pour les résultats multiples
- Utilise des émojis pour rendre les réponses plus lisibles (✅ succès, ❌ erreur, ⚠️ avertissement, 🔌 plugin, 📝 contenu, 🛒 WooCommerce, 🔒 sécurité, ⚡ performance)
- Indique toujours si une action a réussi ou échoué
- Propose des actions complémentaires pertinentes à la fin de chaque réponse`;
