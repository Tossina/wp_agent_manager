# WP_MNGR — Documentation de Projet

> Dernière mise à jour : 2026-03-23
> Statut : **En développement — Structure complète générée, prêt pour l'installation**

---

## Table des matières

1. [Vision du projet](#1-vision-du-projet)
2. [Stack technique](#2-stack-technique)
3. [Architecture](#3-architecture)
4. [Structure des fichiers](#4-structure-des-fichiers)
5. [Base de données](#5-base-de-données)
6. [Démarrage rapide](#6-démarrage-rapide)
7. [Outils IA disponibles](#7-outils-ia-disponibles)
8. [Plugin WordPress](#8-plugin-wordpress)
9. [Variables d'environnement](#9-variables-denvironnement)
10. [Flux utilisateur](#10-flux-utilisateur)
11. [État d'avancement](#11-état-davancement)
12. [Prochaines étapes](#12-prochaines-étapes)
13. [Décisions techniques](#13-décisions-techniques)

---

## 1. Vision du projet

WP_MNGR est un clone de [wpagent.dev](https://wpagent.dev/fr) — un assistant IA pour gérer des sites WordPress et WooCommerce par langage naturel.

**Principe** : l'utilisateur tape "Installe WooCommerce et configure 20% de TVA pour la France" → Claude interprète la demande → appelle les outils WordPress → affiche le résultat.

**Différence avec l'original** : usage personnel d'abord (pas de paiement au départ), clé Claude API personnelle dans `.env.local`. Stripe sera intégré plus tard.

**Inspiré de** : https://wpagent.dev/fr

---

## 2. Stack technique

| Couche | Technologie | Raison du choix |
|--------|-------------|-----------------|
| Framework | **Next.js 15** (App Router) | SSR, API routes, performance |
| UI | **React 19** + **Tailwind CSS 3** | Composants rapides |
| Composants | **Radix UI** + style custom | Accessibilité, headless |
| Auth | **NextAuth v5** (beta.25) | Sessions JWT + Prisma adapter |
| Base de données | **Prisma** + **SQLite** | Simple, sans serveur, portable |
| IA | **Claude Sonnet 4.6** via SDK Anthropic | Meilleur modèle disponible |
| PWA | **next-pwa** | Installation mobile, offline |
| HTTP/3 | Header `Alt-Svc` dans `next.config.ts` | Performance réseau |
| Performance | Priority Hints, `optimizePackageImports` | Score Lighthouse |
| Open Graph | Metadata Next.js (og:image, twitter:card) | Partage social |
| Animations | **Framer Motion** | UI fluide |
| Markdown | **react-markdown** + **remark-gfm** | Rendu réponses IA |
| Validation | **Zod** | Typage des entrées API |
| Paiement | **Stripe** (non intégré — prévu) | Monétisation future |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    NAVIGATEUR / PWA                     │
│  Landing Page → Login/Register → Dashboard → Chat UI   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / HTTP3
┌──────────────────────▼──────────────────────────────────┐
│              NEXT.JS (App Router)                       │
│                                                         │
│  /api/chat ──────► Claude SDK ──► Agentic Loop          │
│  /api/sites                                             │
│  /api/conversations                                     │
│  /api/auth/[...nextauth]                                │
└──────────────────────┬──────────────────────────────────┘
                       │ HMAC-SHA256
┌──────────────────────▼──────────────────────────────────┐
│           WORDPRESS (Plugin Bridge)                     │
│                                                         │
│  /wp-json/wp-agent/v1/execute                           │
│  → WP_Agent_Auth (validation signature)                 │
│  → WP_Agent_Actions (exécution actions)                 │
└─────────────────────────────────────────────────────────┘
```

### Flux d'un message chat

```
User frappe un message
        ↓
POST /api/chat { siteId, conversationId, message }
        ↓
Vérification session NextAuth
        ↓
Récupération historique conversation (20 derniers messages)
        ↓
Claude API — Agentic Loop (max 10 itérations) :
  ┌─ Claude analyse → décide d'appeler un outil
  │   ↓
  │  POST /wp-json/wp-agent/v1/execute (HMAC-SHA256)
  │   ↓
  │  WordPress exécute l'action
  │   ↓
  │  Résultat retourné à Claude
  └─ Claude génère la réponse finale (stop_reason = "end_turn")
        ↓
Sauvegarde message + log en base
        ↓
Retour JSON { response, title? }
```

---

## 4. Structure des fichiers

```
mpiasa_wp/
│
├── app/                                  # Next.js App Router
│   ├── globals.css                       # Variables CSS, Tailwind, animations
│   ├── layout.tsx                        # Root : PWA, OG, fonts Geist, providers
│   ├── page.tsx                          # Landing page (hero, features, pricing)
│   │
│   ├── (auth)/                           # Groupe sans layout dashboard
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── (dashboard)/                      # Protégé par auth
│   │   ├── layout.tsx                    # Sidebar + Topbar
│   │   └── dashboard/
│   │       ├── page.tsx                  # Vue d'ensemble (stats, sites, activité)
│   │       ├── sites/
│   │       │   ├── page.tsx              # Grille des sites connectés
│   │       │   ├── new/page.tsx          # Wizard 3 étapes (infos → plugin → API key)
│   │       │   └── [id]/page.tsx         # Interface chat pour un site
│   │       ├── logs/page.tsx             # Journal de toutes les actions
│   │       └── settings/page.tsx         # Profil, clé API, notifications (WIP)
│   │
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/route.ts    # Handler NextAuth GET/POST
│       │   └── register/route.ts         # Inscription (bcrypt)
│       ├── chat/route.ts                 # ★ Cœur : Claude + agentic loop + logs
│       ├── sites/
│       │   ├── route.ts                  # GET (liste) + POST (créer)
│       │   └── test/route.ts             # Tester connexion WP avant sauvegarde
│       └── conversations/
│           ├── route.ts                  # POST (créer conversation)
│           └── [id]/messages/route.ts    # GET (charger messages)
│
├── components/
│   ├── chat/
│   │   ├── chat-interface.tsx            # ★ Interface chat principale
│   │   └── chat-message.tsx             # Rendu Markdown des messages IA
│   ├── dashboard/
│   │   ├── sidebar.tsx                   # Navigation latérale
│   │   └── topbar.tsx                    # Barre du haut (search, user menu)
│   ├── providers/
│   │   ├── session-provider.tsx          # NextAuth SessionProvider client
│   │   └── theme-provider.tsx            # next-themes
│   └── ui/                              # Composants Radix UI stylisés
│       ├── button.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── badge.tsx
│       ├── avatar.tsx
│       ├── dropdown-menu.tsx
│       ├── toast.tsx
│       └── toaster.tsx
│
├── lib/
│   ├── claude.ts                         # ★ Client Anthropic, 11 outils WP/WC, prompt système
│   ├── wordpress.ts                      # Client HMAC-SHA256, callWPBridge, testWPConnection
│   ├── prisma.ts                         # Singleton PrismaClient
│   ├── auth.ts                           # Config NextAuth (JWT, callbacks, credentials)
│   └── utils.ts                          # cn(), formatDistanceToNow(), truncate()
│
├── hooks/
│   └── use-toast.ts                      # Hook toast (state machine)
│
├── prisma/
│   └── schema.prisma                     # Modèles : User, Site, Conversation, Message, ActionLog
│
├── public/
│   └── manifest.json                     # PWA manifest (icônes, shortcuts)
│
├── wordpress-plugin/
│   └── wp-agent-bridge/
│       ├── wp-agent-bridge.php           # Fichier principal du plugin
│       └── includes/
│           ├── class-wp-agent-auth.php   # ★ Validation HMAC-SHA256 + anti-replay
│           ├── class-wp-agent-api.php    # Enregistrement routes REST + dispatcher
│           ├── class-wp-agent-actions.php # ★ 10 actions WordPress/WooCommerce
│           └── class-wp-agent-admin.php  # Page admin WP (clé API + logs)
│
├── .env.local                            # Variables d'environnement (à remplir)
├── .gitignore
├── next.config.ts                        # PWA + HTTP/3 + headers sécurité
├── tailwind.config.ts                    # Thème custom + animations
├── tsconfig.json
├── postcss.config.js
└── package.json
```

---

## 5. Base de données

**Provider** : SQLite (fichier `prisma/dev.db`)
**ORM** : Prisma 6

### Schéma

```
User
 ├── id, name, email, password (bcrypt), role, plan
 ├── → Account[] (NextAuth OAuth)
 ├── → Session[] (NextAuth)
 ├── → Site[]
 ├── → ApiKey[]
 └── → Conversation[]

Site
 ├── id, userId, name, url, apiKey (clé WP plugin), isActive
 ├── wpVersion, phpVersion, lastSync
 ├── → Conversation[]
 └── → ActionLog[]

Conversation
 ├── id, userId, siteId, title
 └── → Message[]

Message
 └── id, conversationId, role ("user"|"assistant"), content

ActionLog
 └── id, siteId, action, target, status, details
```

### Commandes utiles

```bash
npm run db:push       # Créer/synchroniser le schéma (dev)
npm run db:studio     # Interface visuelle Prisma Studio
npm run db:migrate    # Créer une migration (prod)
```

---

## 6. Démarrage rapide

### Pré-requis

- Node.js 18+
- Un site WordPress accessible (5.8+, PHP 7.4+)
- Une clé API Anthropic : https://console.anthropic.com

### Installation

```bash
# 1. Se placer dans le dossier
cd F:/mpiasa_wp

# 2. Installer les dépendances
npm install

# 3. Installer next-themes (manquant dans package.json)
npm install next-themes

# 4. Remplir les variables d'environnement
# → Ouvrir .env.local et renseigner :
#   ANTHROPIC_API_KEY=sk-ant-...
#   NEXTAUTH_SECRET=<générer avec : openssl rand -base64 32>
#   NEXTAUTH_URL=http://localhost:3000

# 5. Créer la base de données SQLite
npm run db:push

# 6. Lancer en développement
npm run dev
# → http://localhost:3000
```

### Installer le plugin WordPress

```bash
# Option A — manuel
# 1. Aller dans wordpress-plugin/wp-agent-bridge/
# 2. Créer un .zip du dossier wp-agent-bridge/
# 3. Dans WP Admin → Extensions → Ajouter → Téléverser → Installer → Activer

# Option B — via WP-CLI
wp plugin install ./wordpress-plugin/wp-agent-bridge.zip --activate
```

Après activation, aller dans **Réglages → WP_MNGR** pour copier la clé API.

---

## 7. Outils IA disponibles

Les outils que Claude peut appeler sur WordPress (`lib/claude.ts`) :

| Outil | Description |
|-------|-------------|
| `wp_get_site_info` | Version WP, PHP, thème actif, plugins actifs |
| `wp_list_plugins` | Liste plugins (filtrable : all/active/inactive) |
| `wp_install_plugin` | Installe depuis le répertoire WordPress.org |
| `wp_toggle_plugin` | Active ou désactive un plugin |
| `wp_update_plugins` | Met à jour un ou tous les plugins |
| `wp_create_post` | Crée article ou page (avec catégories/tags) |
| `wp_list_posts` | Liste articles/pages avec statut |
| `wc_configure_store` | Devise, pays, taxes, fuseau horaire |
| `wc_create_product` | Crée produit WooCommerce (simple) |
| `wc_list_products` | Liste produits (filtrable par catégorie) |
| `wp_audit` | Audit sécurité/performance/mises à jour |

### Agentic Loop

Claude peut enchaîner plusieurs appels d'outils en une seule conversation (max 10 itérations). Exemple :

```
User: "Installe WooCommerce et configure pour la France"
  → Claude appelle wp_install_plugin(woocommerce)
  → Claude appelle wc_configure_store(currency=EUR, country=FR, tax_rate=20)
  → Claude génère le rapport final
```

---

## 8. Plugin WordPress

### Sécurité HMAC-SHA256

Chaque requête du backend vers WordPress est signée :

```
Headers envoyés :
  X-WP-Agent-Key       : clé API (stockée en option WP)
  X-WP-Agent-Signature : HMAC-SHA256(body, clé_API)
  X-WP-Agent-Timestamp : timestamp ms (anti-replay ±5 min)
```

Le plugin vérifie les 3 en PHP avant d'exécuter quoi que ce soit.

### Endpoint REST

```
POST {site_url}/wp-json/wp-agent/v1/execute
Body : { action: "wp_list_plugins", params: { status: "active" }, timestamp: "..." }
```

### Page admin WordPress

`Réglages → WP_MNGR` affiche :
- La clé API (avec bouton Copier)
- L'URL du site
- Les 20 dernières actions
- Bouton régénérer la clé

---

## 9. Variables d'environnement

Fichier : `.env.local` (ne jamais committer)

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `ANTHROPIC_API_KEY` | ✅ | Clé API Claude (console.anthropic.com) |
| `NEXTAUTH_SECRET` | ✅ | Secret JWT aléatoire (openssl rand -base64 32) |
| `NEXTAUTH_URL` | ✅ | URL de l'app (http://localhost:3000 en dev) |
| `DATABASE_URL` | ✅ | `file:./dev.db` (SQLite) |
| `NEXT_PUBLIC_APP_URL` | Recommandé | URL publique (Open Graph) |
| `WP_BRIDGE_SECRET` | Optionnel | Secret additionnel (non utilisé pour l'instant) |
| `STRIPE_SECRET_KEY` | ❌ (plus tard) | Clé secrète Stripe |
| `STRIPE_PUBLISHABLE_KEY` | ❌ (plus tard) | Clé publique Stripe |
| `STRIPE_WEBHOOK_SECRET` | ❌ (plus tard) | Secret webhook Stripe |

---

## 10. Flux utilisateur

### Inscription / Connexion

```
/ (landing) → /register → création compte (bcrypt) → auto-login → /dashboard
                        → /login → credentials → JWT → /dashboard
```

### Ajouter un site

```
/dashboard/sites/new
  Étape 1 : Nom + URL du site
  Étape 2 : Télécharger + installer le plugin WP_MNGR Bridge
  Étape 3 : Copier la clé API depuis WP Admin → tester → connecter
→ Redirige vers /dashboard/sites/{id} (interface chat)
```

### Gérer un site

```
/dashboard/sites/{id}
  - Sidebar gauche : liste des conversations
  - Zone principale : messages (Markdown rendu)
  - Zone basse : input textarea (Enter = envoyer, Shift+Enter = retour ligne)
  - Suggestions rapides : 4 actions prédéfinies à cliquer
```

---

## 11. État d'avancement

### ✅ Terminé

- [x] Structure Next.js App Router complète
- [x] Tailwind CSS avec thème custom dark/light
- [x] Landing page (hero, features, pricing, CTA)
- [x] Authentification (NextAuth v5 + credentials + bcrypt)
- [x] Pages login / register
- [x] Prisma schema (User, Site, Conversation, Message, ActionLog)
- [x] Dashboard avec stats
- [x] Gestion des sites (liste, ajout wizard 3 étapes)
- [x] Interface chat complète avec historique
- [x] Intégration Claude API (agentic loop, 11 outils)
- [x] 11 outils WordPress/WooCommerce
- [x] Plugin WordPress PHP (auth HMAC, routes REST, 10 actions, admin)
- [x] Journal d'activité
- [x] PWA (manifest, next-pwa)
- [x] HTTP/3 headers
- [x] Open Graph / Twitter Card metadata
- [x] Priority Hints (optimizePackageImports)
- [x] Composants UI (Button, Input, Badge, Avatar, Toast, Dropdown)
- [x] Providers (Session, Theme)

### 🔄 À compléter

- [ ] Ajouter `next-themes` (manquant dans package.json — faire `npm install next-themes`)
- [ ] Créer les icônes PWA (dossier `public/icons/` — 8 tailles de 72px à 512px)
- [ ] Créer l'image Open Graph (`public/og-image.png` — 1200×630px)
- [ ] Créer le fichier `public/wp-agent-bridge.zip` (zipper le dossier plugin)
- [ ] Tester le flow complet avec un vrai site WordPress
- [ ] Page `/dashboard/sites/[id]/settings` (modifier/supprimer un site)
- [ ] Middleware Next.js pour protection des routes (actuellement via `auth()` dans chaque page)

### ❌ Non démarré

- [ ] **Stripe** (paiement, plans Solo/Agency)
- [ ] Mise à jour automatique du titre de conversation (côté client)
- [ ] Upload d'images pour les produits WooCommerce
- [ ] Gestion des médias WordPress
- [ ] Notifications email
- [ ] Multi-langues (fr/en)
- [ ] Export des logs CSV
- [ ] Webhook WordPress → WP_MNGR (notifications en temps réel)
- [ ] Déploiement production (Vercel recommandé)

---

## 12. Prochaines étapes

### Session prochaine — minimum pour tester

```bash
# 1. Compléter .env.local avec votre clé Claude
ANTHROPIC_API_KEY=sk-ant-api03-...

# 2. Installer la dépendance manquante
npm install next-themes

# 3. Init base de données
npm run db:push

# 4. Lancer
npm run dev

# 5. Créer un compte sur http://localhost:3000/register

# 6. Zipper le plugin WordPress
# → Compresser wordpress-plugin/wp-agent-bridge/ en .zip
# → Uploader dans WP Admin

# 7. Tester une conversation
```

### Après les tests — Stripe

```
1. Créer un compte Stripe → récupérer les clés
2. Ajouter dans .env.local :
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
3. Créer les produits/prix dans le dashboard Stripe
4. Implémenter /api/stripe/checkout et /api/stripe/webhook
5. Ajouter la vérification du plan dans les API routes
```

---

## 13. Décisions techniques

| Décision | Choix | Alternative écartée | Raison |
|----------|-------|---------------------|--------|
| DB | SQLite + Prisma | PostgreSQL, MongoDB | Démarrage sans serveur, migration facile plus tard |
| Auth | NextAuth v5 credentials | Clerk, Auth0 | Gratuit, open-source, intégration native Next.js |
| IA | Claude Sonnet 4.6 | GPT-4o, Gemini | Meilleur pour les tâches longues, tool use natif |
| Paiement | Stripe (plus tard) | Paddle, LemonSqueezy | Standard, bien documenté |
| CSS | Tailwind CSS | styled-components | Performance, purge automatique |
| Composants | Radix UI custom | shadcn/ui | Contrôle total du style |
| Plugin WP | Plugin custom PHP | WP REST API natif | Auth HMAC custom + actions groupées |
| Modèle IA | `claude-sonnet-4-6` | `claude-opus-4-6` | Balance coût/performance |

---

## Notes de développement

- Le modèle Claude utilisé est `claude-sonnet-4-6` (défini dans `lib/claude.ts` → `CLAUDE_MODEL`)
- L'agentic loop est limité à **10 itérations** pour éviter les boucles infinies
- L'historique de conversation est limité aux **20 derniers messages** (économie de tokens)
- La signature HMAC utilise la **clé API comme secret** (simple et suffisant pour usage personnel)
- La base SQLite est à **ne pas committer** (dans .gitignore)
- Le fichier `.env.local` est à **ne jamais committer**

---

*Projet créé le 2026-03-23 — Inspiré de wpagent.dev*
