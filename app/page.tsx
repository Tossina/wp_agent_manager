"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  ArrowRight,
  Bot,
  Terminal,
  Layers,
  Cpu,
  Workflow,
  Monitor,
  Lock,
  Gauge,
  Blocks,
  MousePointerClick,
  CircuitBoard,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Typing animation hook ────────────────────────────────
function useTypingEffect(lines: string[], speed = 40) {
  const [displayed, setDisplayed] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (currentLine >= lines.length) {
      setDone(true);
      return;
    }
    if (currentChar <= lines[currentLine].length) {
      const timeout = setTimeout(() => {
        setDisplayed((prev) => {
          const copy = [...prev];
          copy[currentLine] = lines[currentLine].slice(0, currentChar);
          return copy;
        });
        setCurrentChar((c) => c + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else {
      setTimeout(() => {
        setCurrentLine((l) => l + 1);
        setCurrentChar(0);
      }, 400);
    }
  }, [currentLine, currentChar, lines, speed]);

  return { displayed, done };
}

// ─── Animated counter ──────────────────────────────────────
function Counter({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ─── LANDING PAGE ──────────────────────────────────────────
export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -200]);

  const terminalLines = [
    "$ wp_mngr connect votum.fr",
    "✓ Connexion sécurisée établie (HMAC-SHA256)",
    "$ wp_mngr exec \"Installe et configure WooCommerce pour la France\"",
    "⟳ Analyse de la requête...",
    "⟳ Exécution: wp_install_plugin(woocommerce)",
    "✓ WooCommerce installé et activé",
    "⟳ Exécution: wc_configure_store(EUR, FR, TVA: 20%)",
    "✓ Boutique configurée — prête en 8.2s",
  ];

  const { displayed, done } = useTypingEffect(terminalLines, 25);

  const capabilities = [
    {
      icon: Layers,
      label: "Multi-site",
      desc: "Gérez 50+ sites depuis un seul tableau de bord",
      span: "col-span-1 row-span-1",
    },
    {
      icon: Terminal,
      label: "CLI Naturel",
      desc: "Parlez en français, l'IA traduit en actions WordPress",
      span: "col-span-1 row-span-2",
    },
    {
      icon: Lock,
      label: "Sécurité",
      desc: "HMAC-SHA256, audit trail, permissions granulaires",
      span: "col-span-1 row-span-1",
    },
    {
      icon: Gauge,
      label: "Performance",
      desc: "Actions exécutées en moins de 10 secondes",
      span: "col-span-2 row-span-1",
    },
    {
      icon: Blocks,
      label: "WooCommerce",
      desc: "Configuration complète: produits, taxes, livraison, paiements",
      span: "col-span-1 row-span-1",
    },
    {
      icon: Workflow,
      label: "Automatisation",
      desc: "Chaînez les actions : audit → fix → déploiement",
      span: "col-span-1 row-span-1",
    },
  ];

  const techStack = [
    { name: "Gemini", angle: 0 },
    { name: "OpenAI", angle: 60 },
    { name: "Claude", angle: 120 },
    { name: "WordPress", angle: 180 },
    { name: "WooCommerce", angle: 240 },
    { name: "REST API", angle: 300 },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#020617] text-white overflow-x-hidden">
      {/* ── Floating Particles BG ────────────────────── */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <motion.div style={{ y: bgY }} className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 300 + i * 100,
                height: 300 + i * 100,
                left: `${10 + i * 15}%`,
                top: `${5 + i * 20}%`,
                background: i % 2 === 0
                  ? "radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)"
                  : "radial-gradient(circle, rgba(56,189,248,0.04) 0%, transparent 70%)",
              }}
              animate={{
                x: [0, 30 * (i % 2 === 0 ? 1 : -1), 0],
                y: [0, 20 * (i % 2 === 0 ? -1 : 1), 0],
              }}
              transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </motion.div>
      </div>

      {/* ── NAV ──────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/60 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 rounded-lg bg-green-500/20 animate-ping" style={{ animationDuration: "3s" }} />
              <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                <CircuitBoard className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="font-bold text-lg tracking-wider font-mono">WP_MNGR</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                Connexion
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg">
                Lancer WP_MNGR
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════ */}
      {/* ── HERO — Interactive Terminal ───────────── */}
      {/* ══════════════════════════════════════════════ */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-10 relative">
        {/* Glow rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-green-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-green-500/[0.03]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/20 bg-green-500/5 text-green-400 text-xs font-mono mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            MULTI-IA : Gemini · OpenAI · Claude
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95] mb-6">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-emerald-400 to-cyan-400">
              Votre WordPress.
            </span>
            <span className="block text-white/90 mt-2">
              Votre IA.
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
            Le centre de contrôle IA qui pilote vos sites WordPress
            et WooCommerce en langage naturel.
          </p>
        </motion.div>

        {/* Terminal */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="w-full max-w-2xl"
        >
          <div className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-[0_0_60px_rgba(34,197,94,0.08)] overflow-hidden">
            {/* Title bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <span className="text-[11px] text-gray-500 font-mono">wp_mngr — terminal</span>
              <div className="w-14" />
            </div>
            {/* Terminal content */}
            <div className="p-5 font-mono text-[13px] leading-relaxed min-h-[260px] space-y-1">
              {displayed.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.startsWith("✓")
                      ? "text-green-400"
                      : line.startsWith("⟳")
                      ? "text-cyan-400"
                      : line.startsWith("$")
                      ? "text-gray-200"
                      : "text-gray-500"
                  }
                >
                  {line}
                  {i === displayed.length - 1 && !done && (
                    <span className="inline-block w-2 h-4 ml-1 bg-green-400 animate-pulse" />
                  )}
                </div>
              ))}
              {done && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 pt-3 border-t border-white/5 text-gray-400"
                >
                  $ <span className="text-green-400 animate-pulse">_</span>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* CTA under terminal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-8 flex flex-col sm:flex-row gap-4"
        >
          <Link href="/register">
            <Button size="lg" className="bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl px-8 gap-2">
              Essayer maintenant
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <a href="#capabilities">
            <Button size="lg" variant="outline" className="rounded-xl px-8 border-white/10 text-gray-300 hover:text-white hover:border-white/20">
              Découvrir
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </a>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* ── STATS BAR ────────────────────────────── */}
      {/* ══════════════════════════════════════════════ */}
      <section className="py-16 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 8, suffix: "s", label: "Temps moyen d'exécution" },
            { value: 50, suffix: "+", label: "Sites gérables" },
            { value: 3, suffix: "", label: "Fournisseurs IA" },
            { value: 100, suffix: "%", label: "Sécurisé (HMAC)" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-3xl sm:text-4xl font-black text-green-400 font-mono">
                <Counter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* ── BENTO GRID — Capabilities ────────────── */}
      {/* ══════════════════════════════════════════════ */}
      <section id="capabilities" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <span className="text-green-400 text-xs font-mono uppercase tracking-[0.3em]">Capacités</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3 tracking-tight">
              Un seul outil,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">
                toute la puissance WordPress.
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[180px]">
            {capabilities.map((cap, i) => (
              <motion.div
                key={cap.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className={`${cap.span} group rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-6 hover:border-green-500/30 hover:bg-green-500/[0.03] transition-all duration-500 flex flex-col justify-between relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-500/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <cap.icon className="w-6 h-6 text-green-400 mb-3" />
                  <h3 className="font-bold text-lg">{cap.label}</h3>
                </div>
                <p className="text-sm text-gray-500 relative z-10">{cap.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* ── ORBITAL — AI Providers ───────────────── */}
      {/* ══════════════════════════════════════════════ */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <span className="text-green-400 text-xs font-mono uppercase tracking-[0.3em]">Écosystème</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3 mb-6">
              Propulsé par l&apos;IA de votre choix
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto mb-16">
              Choisissez votre fournisseur IA préféré ou laissez WP_MNGR basculer automatiquement vers le meilleur disponible.
            </p>
          </motion.div>

          {/* Orbital diagram */}
          <div className="relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] mx-auto">
            {/* Rings */}
            <div className="absolute inset-0 rounded-full border border-white/5" />
            <div className="absolute inset-8 rounded-full border border-white/[0.08]" />

            {/* Center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.3)] z-10">
              <Cpu className="w-8 h-8 text-white" />
            </div>

            {/* Orbiting items */}
            {techStack.map((tech) => {
              const radius = 150;
              const rad = (tech.angle * Math.PI) / 180;
              const x = Math.cos(rad) * radius;
              const y = Math.sin(rad) * radius;
              return (
                <motion.div
                  key={tech.name}
                  className="absolute top-1/2 left-1/2 z-10"
                  style={{ x: x - 30, y: y - 16 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: tech.angle / 100 }}
                >
                  <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-gray-300 backdrop-blur-sm whitespace-nowrap hover:border-green-500/40 hover:text-green-400 transition-colors">
                    {tech.name}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* ── HOW IT WORKS — Vertical timeline ──────── */}
      {/* ══════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <span className="text-green-400 text-xs font-mono uppercase tracking-[0.3em]">Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3">
              Du zéro au contrôle total
            </h2>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-green-500/50 via-green-500/20 to-transparent" />

            {[
              { num: "01", title: "Connectez", desc: "Installez le plugin Bridge et générez votre clé API sécurisée en 30 secondes.", icon: Monitor },
              { num: "02", title: "Commandez", desc: "Décrivez en langage naturel ce que vous voulez : l'IA comprend et planifie les actions.", icon: MousePointerClick },
              { num: "03", title: "Observez", desc: "Suivez en temps réel chaque action exécutée avec un log détaillé et transparent.", icon: Workflow },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="relative flex gap-6 md:gap-8 mb-16 last:mb-0"
              >
                <div className="relative z-10 w-12 h-12 md:w-16 md:h-16 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                  <step.icon className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
                </div>
                <div className="pt-2 md:pt-4">
                  <span className="text-green-400/50 text-xs font-mono">{step.num}</span>
                  <h3 className="text-xl font-bold mt-1">{step.title}</h3>
                  <p className="text-gray-500 mt-2 text-sm leading-relaxed max-w-md">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* ── CTA — Full width ─────────────────────── */}
      {/* ══════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            {/* BG gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-cyan-500/10" />
            <div className="absolute inset-0 border border-green-500/20 rounded-3xl" />

            <div className="relative z-10 p-12 sm:p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
                <Bot className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                Reprenez le contrôle<br />de vos sites WordPress
              </h2>
              <p className="text-gray-400 max-w-lg mx-auto mb-8">
                Gratuit pour commencer. Aucune carte bancaire requise.
                Choisissez votre IA préférée et lancez-vous.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" className="bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl px-10 gap-2">
                    Créer mon compte
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-gray-600 mt-4 font-mono">
                Compatible Gemini · OpenAI · Claude · WordPress 5.x & 6.x · WooCommerce
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
              <CircuitBoard className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm font-mono tracking-wider">WP_MNGR</span>
          </div>
          <p className="text-xs text-gray-600">
            © 2026 WP_MNGR. Tous droits réservés.
          </p>
          <div className="flex gap-4 text-xs text-gray-600">
            <a href="/privacy" className="hover:text-white transition-colors">Confidentialité</a>
            <a href="/terms" className="hover:text-white transition-colors">CGU</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
