# WP_MNGR

Gérez vos sites WordPress et WooCommerce avec l'intelligence artificielle — en langage naturel.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=flat-square&logo=tailwindcss)
![AI](https://img.shields.io/badge/AI-Gemini%20%7C%20OpenAI%20%7C%20Claude-purple?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## Aperçu

WP_MNGR est une application web qui permet de gérer des sites WordPress via une interface de chat alimentée par l'Intelligence Artificielle (Gemini, OpenAI, Claude). Décrivez ce que vous voulez faire en langage naturel, l'agent s'occupe du reste grâce à ses 36 outils spécialisés.

```
Vous     → "Installe WooCommerce et configure la boutique pour la France avec 20% de TVA"
WP_MNGR → Installe le plugin ✅ · Configure la devise EUR ✅ · Active les taxes 20% ✅
           "Votre boutique est prête en 8 secondes !"
```

---

## Fonctionnalités

- **36 Commandes IA (9 Catégories)** — WordPress Core, WooCommerce, Builders, SEO, Sécurité, Performance, Utilisateurs, Médias, Maintenance.
- **Gestion WooCommerce** — commandes, coupons, livraison, paiements, rapports de ventes.
- **Thèmes & Builders** — configuration automatique d'Elementor, Divi, Bricks, Beaver, Gutenberg.
- **Sécurité & Performance** — hardening, nettoyage DB, installation cache (LiteSpeed/W3TC), sauvegardes auto (UpdraftPlus).
- **Tableau de bord IA** — commandes rapides interactives, historique d'actions complet, gestion multi-sites.
- **PWA** — installez l'app sur mobile ou desktop
- **Sécurité** — authentification HMAC-SHA256 entre l'app et WordPress

---

## Prérequis

- **Node.js** 18+
- **Un site WordPress** (5.8+, PHP 7.4+) accessible publiquement
- **Clé API IA** — Gemini (Google), OpenAI, ou Claude (Anthropic)

---

## Installation

### 1. Cloner et installer

```bash
git clone <votre-repo>
cd wp_agent_manager
npm install
npm install next-themes
```

### 2. Variables d'environnement

Copiez `.env.local` et renseignez vos valeurs :

```bash
# Base (Obligatoire)
NEXTAUTH_SECRET=                     # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=file:./dev.db

# Intelligence Artificielle (Au moins une clé)
AI_PROVIDER=gemini                   # "gemini" | "openai" | "anthropic" (défaut: premier trouvé)
GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-api03-...
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=file:./dev.db

# Optionnel
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Base de données

```bash
npm run db:push
```

### 4. Lancer en développement

```bash
npm run dev
# → http://localhost:3000
```

---

## Plugin WordPress

Le plugin **WP_MNGR Bridge (v1.1.0)** est requis sur chaque site WordPress à connecter.

### Installation

1. Télécharger `wp-mngr-bridge.zip` depuis votre tableau de bord (ou créer le zip depuis `wordpress-plugin/wp-agent-bridge/`)
2. Dans WordPress : **Extensions → Ajouter → Téléverser**
3. Installer et activer
4. Aller dans **Réglages → WP_MNGR** pour copier la clé API

### Sécurité

Chaque requête est signée avec HMAC-SHA256 et contient un timestamp anti-replay (±5 min). Aucune donnée n'est stockée en dehors de votre serveur WordPress.

---

## Stack

| | |
|--|--|
| Framework | Next.js 15 (App Router) |
| Langage | TypeScript 5 |
| Style | Tailwind CSS 3 + Radix UI |
| Auth | NextAuth v5 |
| Base de données | Prisma + SQLite |
| IA | Gemini 2.5 Flash / GPT-4o / Claude 3.5 Sonnet |
| PWA | next-pwa |
| Animations | Framer Motion |

---

## Scripts

```bash
npm run dev          # Développement
npm run build        # Build production
npm run start        # Démarrer en production
npm run db:push      # Synchroniser le schéma Prisma
npm run db:studio    # Interface visuelle de la base de données
npm run db:migrate   # Créer une migration (production)
```

---

## Structure

```
├── app/                  # Pages et API routes (Next.js App Router)
├── components/           # Composants React (chat, dashboard, ui)
├── lib/                  # Claude, WordPress, Prisma, Auth, utils
├── hooks/                # useToast
├── prisma/               # Schéma base de données
├── public/               # Manifest PWA, icônes
├── wordpress-plugin/     # Plugin PHP WP_MNGR Bridge
├── .env.local            # Variables d'environnement (ne pas committer)
└── PROJECT.md            # Documentation technique complète
```

> Pour une documentation détaillée (architecture, flux, décisions techniques, roadmap), voir [`PROJECT.md`](./PROJECT.md).

---

## Licence

MIT
