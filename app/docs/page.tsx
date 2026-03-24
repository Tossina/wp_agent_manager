import Link from "next/link";
import {
  Terminal,
  Globe,
  ShoppingCart,
  Palette,
  Search,
  Shield,
  Gauge,
  Users,
  FileText,
  Wrench,
  ArrowLeft,
  Download,
  Key,
  Code,
  BookOpen,
  ChevronRight,
  Zap,
  MessageSquare,
  CircuitBoard,
} from "lucide-react";

const commandCategories = [
  {
    id: "wordpress",
    icon: Globe,
    title: "WordPress Core",
    color: "text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    commands: [
      { name: "wp_get_site_info", desc: "Informations du site (version, thème, plugins…)", example: "Donne-moi les infos de mon site" },
      { name: "wp_list_plugins", desc: "Lister plugins installés (actif/inactif + MAJ)", example: "Liste tous les plugins actifs" },
      { name: "wp_install_plugin", desc: "Installer un plugin depuis le répertoire officiel", example: "Installe le plugin WooCommerce" },
      { name: "wp_toggle_plugin", desc: "Activer ou désactiver un plugin", example: "Désactive le plugin Akismet" },
      { name: "wp_update_plugins", desc: "Mettre à jour un ou tous les plugins", example: "Mets à jour tous les plugins" },
      { name: "wp_create_post", desc: "Créer un article ou une page (avec image à la une via URL)", example: "Crée un article avec l'image https://example.com/photo.jpg" },
      { name: "wp_list_posts", desc: "Lister articles/pages avec filtres", example: "Montre les 10 derniers articles" },
      { name: "wp_audit", desc: "Audit complet (sécurité, performance, MAJ)", example: "Fais un audit complet de mon site" },
    ],
  },
  {
    id: "woocommerce",
    icon: ShoppingCart,
    title: "WooCommerce",
    color: "text-purple-400",
    border: "border-purple-500/30",
    bg: "bg-purple-500/5",
    commands: [
      { name: "wc_configure_store", desc: "Configurer devise, pays, taxes, fuseau horaire", example: "Configure ma boutique pour la France en EUR" },
      { name: "wc_create_product", desc: "Créer un produit simple (prix, SKU, stock, catégories, image)", example: "Crée un T-shirt noir à 29.99€ avec l'image https://example.com/tshirt.jpg" },
      { name: "wc_create_variable_product", desc: "Créer un produit variable avec attributs (Couleur, Taille…) et variations (prix/SKU/stock/image par variante)", example: "Crée un T-shirt en Blanc/Noir et tailles S/M/L à 29.99€" },
      { name: "wc_list_products", desc: "Lister produits avec filtres", example: "Liste tous les produits publiés" },
      { name: "wc_list_orders", desc: "Lister commandes avec filtres (statut, date)", example: "Montre les 10 dernières commandes" },
      { name: "wc_update_order", desc: "Changer statut, ajouter note", example: "Passe la commande #42 en expédiée" },
      { name: "wc_create_coupon", desc: "Créer code promo (%, fixe, livraison gratuite)", example: "Crée un code promo NOEL2026 -20%" },
      { name: "wc_list_coupons", desc: "Lister tous les coupons actifs", example: "Liste les codes promo actifs" },
      { name: "wc_setup_shipping", desc: "Configurer zones et méthodes de livraison", example: "Configure livraison gratuite au-dessus de 50€" },
      { name: "wc_list_payment_gateways", desc: "Lister/activer/désactiver passerelles", example: "Quelles passerelles de paiement sont actives?" },
      { name: "wc_get_sales_report", desc: "Rapport de ventes (CA, commandes, top produits)", example: "Donne-moi les ventes du mois" },
    ],
  },
  {
    id: "builders",
    icon: Palette,
    title: "Thèmes & Builders",
    color: "text-pink-400",
    border: "border-pink-500/30",
    bg: "bg-pink-500/5",
    commands: [
      { name: "wp_list_themes", desc: "Lister thèmes installés + thème actif", example: "Liste tous les thèmes installés" },
      { name: "wp_install_theme", desc: "Installer un thème depuis le répertoire officiel", example: "Installe le thème flavor" },
      { name: "wp_setup_builder", desc: "Configuration complète d'un page builder (Elementor, Divi, Bricks, Beaver, Gutenberg)", example: "Configure mon site pour Elementor" },
    ],
  },
  {
    id: "seo",
    icon: Search,
    title: "SEO",
    color: "text-yellow-400",
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/5",
    commands: [
      { name: "wp_setup_seo", desc: "Installer et configurer plugin SEO + permalinks", example: "Configure Yoast SEO pour mon site" },
      { name: "wp_set_meta", desc: "Modifier titre SEO et meta description d'un post", example: "Change le titre SEO de la page d'accueil" },
      { name: "wp_configure_permalinks", desc: "Changer la structure des permalinks", example: "Configure les permalinks en /nom-article/" },
    ],
  },
  {
    id: "security",
    icon: Shield,
    title: "Sécurité",
    color: "text-orange-400",
    border: "border-orange-500/30",
    bg: "bg-orange-500/5",
    commands: [
      { name: "wp_setup_security", desc: "Installer plugin sécurité + hardening automatique", example: "Sécurise mon site WordPress" },
      { name: "wp_setup_backup", desc: "Installer UpdraftPlus + configurer sauvegardes auto", example: "Configure une sauvegarde automatique" },
      { name: "wp_harden", desc: "Désactiver XML-RPC, file editor, masquer version WP", example: "Renforce la sécurité de mon site" },
    ],
  },
  {
    id: "performance",
    icon: Gauge,
    title: "Performance",
    color: "text-cyan-400",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/5",
    commands: [
      { name: "wp_setup_cache", desc: "Installer plugin de cache + Autoptimize", example: "Installe et configure LiteSpeed Cache" },
      { name: "wp_optimize_db", desc: "Nettoyer révisions, transients, spam + optimiser tables", example: "Optimise la base de données" },
    ],
  },
  {
    id: "users",
    icon: Users,
    title: "Utilisateurs",
    color: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    commands: [
      { name: "wp_list_users", desc: "Lister utilisateurs avec filtres par rôle", example: "Liste tous les administrateurs" },
      { name: "wp_create_user", desc: "Créer utilisateur avec rôle et mot de passe", example: "Crée un éditeur jean@site.fr" },
      { name: "wp_manage_user", desc: "Changer rôle, réinitialiser mdp, supprimer", example: "Change le rôle de Jean en admin" },
    ],
  },
  {
    id: "content",
    icon: FileText,
    title: "Médias & Contenu",
    color: "text-indigo-400",
    border: "border-indigo-500/30",
    bg: "bg-indigo-500/5",
    commands: [
      { name: "wp_list_media", desc: "Lister fichiers médias (images, vidéos, PDF)", example: "Montre les dernières images uploadées" },
      { name: "wp_manage_comments", desc: "Lister, approuver, supprimer spam", example: "Supprime tous les commentaires spam" },
      { name: "wp_manage_menu", desc: "Créer/modifier menus de navigation", example: "Ajoute la page Contact au menu principal" },
    ],
  },
  {
    id: "maintenance",
    icon: Wrench,
    title: "Maintenance",
    color: "text-rose-400",
    border: "border-rose-500/30",
    bg: "bg-rose-500/5",
    commands: [
      { name: "wp_update_settings", desc: "Modifier réglages (titre, tagline, timezone, langue…)", example: "Change le titre du site en Mon Super Site" },
      { name: "wp_bulk_action", desc: "Actions en masse (MAJ all plugins/thèmes, cleanup)", example: "Mets à jour tous les plugins et thèmes" },
      { name: "wp_clear_cache", desc: "Purger cache (LiteSpeed, WPSC, W3TC, Object Cache)", example: "Vide le cache du site" },
    ],
  },
];

const steps = [
  {
    num: "01",
    title: "Créer votre compte",
    desc: "Inscrivez-vous sur WP_MNGR et accédez au tableau de bord.",
    icon: Key,
  },
  {
    num: "02",
    title: "Installer le plugin WordPress",
    desc: "Téléchargez wp-mngr-bridge.zip et installez-le sur votre site WordPress via Extensions → Ajouter → Téléverser.",
    icon: Download,
  },
  {
    num: "03",
    title: "Connecter votre site",
    desc: 'Dans les réglages du plugin, copiez la clé API. Dans WP_MNGR, cliquez "Ajouter un site" et collez l\'URL + la clé API.',
    icon: Globe,
  },
  {
    num: "04",
    title: "Parler à votre site",
    desc: 'Ouvrez le chat, sélectionnez votre site et tapez vos commandes en langage naturel. L\'IA exécute les actions.",',
    icon: MessageSquare,
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0a0e1a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                <CircuitBoard className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold font-mono text-white tracking-wider">WP_MNGR</span>
            </Link>
            <span className="text-white/20 text-lg">/</span>
            <span className="text-white/60 text-sm font-medium">Documentation</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">
              Connexion
            </Link>
            <Link
              href="/register"
              className="bg-green-500 hover:bg-green-400 text-black font-medium text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Lancer WP_MNGR
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-6">
            <BookOpen className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs text-green-400 font-mono">DOCUMENTATION v2.1</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            Guide complet
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
              WP_MNGR
            </span>
          </h1>
          <p className="text-white/50 max-w-xl mx-auto text-lg">
            Apprenez à gérer vos sites WordPress en langage naturel.
            39 commandes, 9 catégories, zéro code.
          </p>
        </div>

        {/* Quick Start */}
        <section className="mb-24" id="quickstart">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <Zap className="w-6 h-6 text-green-400" />
            Démarrage rapide
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step) => (
              <div
                key={step.num}
                className="relative rounded-xl border border-white/10 bg-white/[0.02] p-6 group hover:border-green-500/30 transition-colors"
              >
                <div className="text-3xl font-black text-green-500/20 mb-4 font-mono">{step.num}</div>
                <step.icon className="w-5 h-5 text-green-400 mb-3" />
                <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Plugin Installation */}
        <section className="mb-24" id="installation">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <Download className="w-6 h-6 text-green-400" />
            Installation du Plugin
          </h2>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Prérequis</h3>
                <ul className="space-y-3 text-white/50 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                    WordPress 5.0 ou supérieur
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                    PHP 7.4 ou supérieur
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                    WooCommerce (pour les commandes WooCommerce)
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                    Accès administrateur à WordPress
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Installation</h3>
                <div className="space-y-3 text-white/50 text-sm">
                  <div className="flex gap-3">
                    <span className="text-green-400 font-mono text-xs mt-0.5 flex-shrink-0">1.</span>
                    <span>Téléchargez <code className="text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded text-xs">wp-mngr-bridge.zip</code> depuis votre tableau de bord WP_MNGR</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-green-400 font-mono text-xs mt-0.5 flex-shrink-0">2.</span>
                    <span>Dans WordPress : Extensions → Ajouter → Téléverser une extension</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-green-400 font-mono text-xs mt-0.5 flex-shrink-0">3.</span>
                    <span>Sélectionnez le fichier ZIP et cliquez &quot;Installer maintenant&quot;</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-green-400 font-mono text-xs mt-0.5 flex-shrink-0">4.</span>
                    <span>Activez le plugin</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-green-400 font-mono text-xs mt-0.5 flex-shrink-0">5.</span>
                    <span>Dans Réglages → WP_MNGR Bridge, copiez la clé API</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-lg bg-[#0d1117] border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-white/30 text-xs ml-2 font-mono">sécurité</span>
              </div>
              <p className="text-white/40 text-xs font-mono">
                <span className="text-green-400">$</span> Communication sécurisée via <span className="text-cyan-300">HMAC-SHA256</span><br />
                <span className="text-green-400">$</span> Chaque requête est signée + horodatée (anti-replay)<br />
                <span className="text-green-400">$</span> Clé API unique par site — jamais partagée
              </p>
            </div>
          </div>
        </section>

        {/* Table of contents */}
        <section className="mb-12" id="commands">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <Terminal className="w-6 h-6 text-green-400" />
            Référence des commandes
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-12">
            {commandCategories.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className={`rounded-lg border ${cat.border} ${cat.bg} p-3 hover:bg-opacity-20 transition-all group`}
              >
                <cat.icon className={`w-4 h-4 ${cat.color} mb-2`} />
                <div className="text-sm font-medium text-white">{cat.title}</div>
                <div className="text-xs text-white/30 mt-0.5">{cat.commands.length} commande{cat.commands.length > 1 ? "s" : ""}</div>
              </a>
            ))}
          </div>
        </section>

        {/* Command sections */}
        {commandCategories.map((cat) => (
          <section key={cat.id} id={cat.id} className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-8 h-8 rounded-lg ${cat.bg} flex items-center justify-center border ${cat.border}`}>
                <cat.icon className={`w-4 h-4 ${cat.color}`} />
              </div>
              <h3 className="text-xl font-bold text-white">{cat.title}</h3>
              <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full font-mono">
                {cat.commands.length} commande{cat.commands.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-3">
              {cat.commands.map((cmd) => (
                <div
                  key={cmd.name}
                  className={`rounded-lg border ${cat.border} bg-white/[0.01] p-4 hover:bg-white/[0.03] transition-colors`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className={`text-sm font-mono font-bold ${cat.color}`}>{cmd.name}</code>
                      </div>
                      <p className="text-white/50 text-sm">{cmd.desc}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-[10px] text-white/20 uppercase tracking-wider mb-1">Exemple</div>
                      <div className="text-xs text-white/40 bg-white/5 rounded px-2.5 py-1 font-mono max-w-[250px] text-left">
                        &quot;{cmd.example}&quot;
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* AI Providers */}
        <section className="mb-24" id="providers">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <Code className="w-6 h-6 text-green-400" />
            Fournisseurs IA
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                name: "Gemini",
                provider: "Google",
                model: "gemini-2.5-flash",
                env: "GEMINI_API_KEY",
                color: "text-blue-400",
                border: "border-blue-500/20",
                bg: "bg-blue-500/5",
              },
              {
                name: "OpenAI",
                provider: "Microsoft",
                model: "gpt-4o",
                env: "OPENAI_API_KEY",
                color: "text-emerald-400",
                border: "border-emerald-500/20",
                bg: "bg-emerald-500/5",
              },
              {
                name: "Claude",
                provider: "Anthropic",
                model: "claude-sonnet-4-20250514",
                env: "ANTHROPIC_API_KEY",
                color: "text-orange-400",
                border: "border-orange-500/20",
                bg: "bg-orange-500/5",
              },
            ].map((ai) => (
              <div key={ai.name} className={`rounded-xl border ${ai.border} ${ai.bg} p-6`}>
                <div className={`text-xl font-bold ${ai.color} mb-1`}>{ai.name}</div>
                <div className="text-white/30 text-xs mb-4">{ai.provider}</div>
                <div className="text-xs text-white/50 space-y-2">
                  <div>
                    <span className="text-white/30">Modèle: </span>
                    <code className="text-white/60 bg-white/5 px-1.5 py-0.5 rounded">{ai.model}</code>
                  </div>
                  <div>
                    <span className="text-white/30">Variable: </span>
                    <code className="text-white/60 bg-white/5 px-1.5 py-0.5 rounded">{ai.env}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-lg border border-white/10 bg-white/[0.02]">
            <p className="text-white/40 text-sm">
              <span className="text-green-400 font-bold">💡 Tip : </span>
              Définissez <code className="text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded text-xs">AI_PROVIDER=gemini</code> dans
              votre fichier <code className="text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded text-xs">.env.local</code> pour
              choisir le fournisseur. Sans cette variable, WP_MNGR utilise automatiquement le premier fournisseur dont la clé API est configurée.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 pt-12 pb-8 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
              <CircuitBoard className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold font-mono text-white/60 tracking-wider">WP_MNGR</span>
          </div>
          <p className="text-white/20 text-sm">
            Gérez WordPress avec l&apos;intelligence artificielle.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6">
            <Link href="/" className="text-white/30 hover:text-white/60 text-sm transition-colors">
              Accueil
            </Link>
            <Link href="/login" className="text-white/30 hover:text-white/60 text-sm transition-colors">
              Connexion
            </Link>
            <Link href="/register" className="text-white/30 hover:text-white/60 text-sm transition-colors">
              Inscription
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
