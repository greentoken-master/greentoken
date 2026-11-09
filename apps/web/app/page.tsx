"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/lib/wallet-context"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n-context"
import { LanguageSelector } from "@/components/language-selector"
import { WalletConfirmationModal } from "@/components/wallet-confirmation-modal"
import { ProfileSetupModal } from "@/components/profile-setup-modal"
import { ArrowRight, ChevronDown } from "lucide-react"

// ── Brand hex pattern (exact from Brand Identity System: 3-hex tessellating grid 88×76) ──
function HexPattern({ id, stroke = "rgba(22,163,74,0.35)" }: { id: string; stroke?: string }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={id} x="0" y="0" width="88" height="76" patternUnits="userSpaceOnUse">
          <polygon points="22,2 42,13 42,37 22,48 2,37 2,13" fill="none" stroke={stroke} strokeWidth="1" />
          <polygon points="66,2 86,13 86,37 66,48 46,37 46,13" fill="none" stroke={stroke} strokeWidth="1" />
          <polygon points="44,40 64,51 64,75 44,86 24,75 24,51" fill="none" stroke={stroke} strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

// ── Certificate card — Social Card from Brand Identity (Visual signature of GreenToken) ──
function CertCard() {
  return (
    <div className="relative overflow-hidden flex flex-col gap-8 rounded-2xl bg-deep-navy p-9 shadow-[0_32px_80px_rgba(0,0,0,0.35),0_4px_16px_rgba(0,0,0,0.2)]">
      <HexPattern id="hexcert" stroke="rgba(22,163,74,0.35)" />
      {/* Label */}
      <p className="relative z-10 text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-green">
        Certificado emitido · Testnet
      </p>
      {/* Central data */}
      <div className="relative z-10">
        <p className="text-[56px] font-bold text-solar-gold leading-none tracking-[-0.04em] mb-2">
          152.4
        </p>
        <p className="text-[13px] font-light text-white/40 mb-3">
          MWh certificados en Stellar
        </p>
        <p className="text-sm font-medium text-white leading-relaxed tracking-[-0.01em]">
          Cooperativa Solar<br />Andina Sur · Junio 2026
        </p>
      </div>
      {/* Footer */}
      <div className="relative z-10 flex items-center justify-between">
        <img src="/GreenToken-assets/logo-white.svg" alt="GreenToken" className="h-4" />
        <span className="text-[8px] text-white/20 tracking-[0.1em]">greentoken.coop</span>
      </div>
    </div>
  )
}

// ── Phone mockup — from Brand Identity digital mockups section ──
function PhoneMockup() {
  const bars = [35, 55, 45, 70, 60, 85, 75]
  return (
    <div className="flex flex-col gap-1.5 overflow-hidden w-[190px] rounded-[28px] bg-[#1E293B] p-3 shadow-[0_24px_64px_rgba(0,0,0,0.4)]">
      <div className="w-11 h-[5px] bg-deep-navy rounded-[3px] mx-auto mb-1.5" />
      <div className="flex items-center justify-between mb-0.5 rounded-xl bg-deep-navy p-3">
        <div>
          <p className="text-[8px] text-white/40 uppercase tracking-[0.06em]">Cooperativa Solar</p>
          <p className="text-[10px] font-semibold text-white mt-px">Andina Sur</p>
        </div>
        <p className="text-[11px] font-semibold text-solar-gold">↑ 12%</p>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { v: "842", l: "kWh hoy", c: "text-white" },
          { v: "38", l: "Certs.", c: "text-solar-gold" },
          { v: "24", l: "Miembros", c: "text-white" },
          { v: "OK", l: "Estado", c: "text-emerald-500" },
        ].map((stat, i) => (
          <div key={i} className="rounded-[10px] bg-deep-navy p-2.5">
            <p className={`text-[15px] font-bold leading-none ${stat.c}`}>{stat.v}</p>
            <p className="text-[7px] text-white/30 uppercase tracking-[0.06em] mt-[3px]">{stat.l}</p>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-[3px] h-[72px] rounded-[10px] bg-deep-navy p-2.5">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-[2px]"
            style={{ height: `${h}%`, background: i === 5 ? "#FFD500" : "#16a34a" }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Data ──────────────────────────────────────────────────────────────────

const PERSONALITY = [
  { word: "Trustworthy", desc: "Cada activo emitido es verificable on-chain. La confianza no se declara, se demuestra con datos inmutables." },
  { word: "Transparent", desc: "Sin registros opacos ni intermediarios. El proceso de emisión y validación es abierto, auditable y accesible para todos." },
  { word: "Pioneering", desc: "Primera infraestructura de atributos ambientales energéticos sobre Stellar. Construimos el estándar, no lo seguimos." },
  { word: "Precise", desc: "1 token = 1 kWh. Sin ambigüedad, sin aproximación. La precisión es el núcleo del valor que entregamos." },
  { word: "Sustainable", desc: "No es greenwashing, es evidencia verificable. GreenToken existe para que las cooperativas puedan demostrar su impacto real." },
  { word: "Enterprise", desc: "Diseñado para compradores institucionales, fondos ESG y mercados de atributos ambientales. Serio, escalable, global." },
]

const STEPS = [
  { num: "01", title: "La cooperativa registra su generación eléctrica.", desc: "Datos de producción ingresados en la plataforma, manual o mediante integración." },
  { num: "02", title: "La energía producida es validada.", desc: "GreenToken verifica la información conforme a su metodología antes de proceder." },
  { num: "03", title: "Se emite un certificado digital único.", desc: "Cada certificado recibe un identificador único y queda registrado en blockchain Stellar." },
  { num: "04", title: "Las empresas adquieren y retiran certificados.", desc: "Para respaldar sus compromisos ambientales. Cada retiro es definitivo e irreversible." },
]

const AUDIENCES = [
  { role: "Cooperativas", desc: "Convertí la energía que ya generás en activos ambientales con valor demostrable. Sin procesos manuales." },
  { role: "Empresas", desc: "Respaldá tus objetivos ESG con atributos ambientales verificables, trazables y auditables." },
  { role: "Auditores", desc: "Accedé a registros transparentes con historial completo, verificables en cualquier momento." },
  { role: "Inversores", desc: "Conocé el origen y el recorrido completo de cada activo ambiental antes de tomar decisiones." },
]

const FAQ = [
  { q: "¿Qué es un Certificado GreenToken?", a: "Representa un volumen específico de energía renovable verificada por una cooperativa participante. Cada activo tiene un identificador único y un historial trazable desde su emisión hasta su retiro." },
  { q: "¿Es un crédito de carbono?", a: "No. Los certificados GreenToken acreditan atributos ambientales de generación de energía renovable — el origen y la cantidad de energía producida. Un crédito de carbono representa reducción o captura de emisiones. Son instrumentos distintos con finalidades distintas." },
  { q: "¿Quién valida la información?", a: "La generación registrada es verificada mediante la metodología definida por GreenToken antes de emitir cualquier activo. El proceso está documentado y es auditable por terceros." },
  { q: "¿Por qué blockchain?", a: "Porque garantiza un historial inmutable, trazable y verificable sin depender de un único intermediario. Una vez registrado, ningún actor puede modificar el estado de un activo sin que quede evidencia." },
  { q: "¿Qué significa retirar un certificado?", a: "Significa que una empresa utilizó ese activo para respaldar un compromiso ambiental. Una vez retirado, queda marcado como usado de forma definitiva — esto elimina el doble conteo estructuralmente." },
  { q: "¿Puede verificarse externamente?", a: "Sí. Cualquier persona puede consultar el historial y la autenticidad de cualquier activo en cualquier momento, sin necesidad de acceder a sistemas propietarios." },
  { q: "¿Quién puede emitir certificados?", a: "Las cooperativas energéticas registradas que cumplan con el proceso de validación de GreenToken y operen conforme a la metodología de registro." },
  { q: "¿Qué información queda on-chain?", a: "El identificador del activo y la información necesaria para verificar su autenticidad e integridad. Los datos operativos y la documentación de respaldo permanecen off-chain, referenciados por hash." },
]

// ── Page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { isConnected, connectWallet, userProfile, setUserProfile } = useWallet()
  const { login, isAuthenticated } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isConnected && isAuthenticated && userProfile) router.push("/dashboard")
  }, [isConnected, isAuthenticated, userProfile, router])

  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").gsap.context> | undefined
    async function init() {
      const { gsap } = await import("gsap")
      const { ScrollTrigger } = await import("gsap/ScrollTrigger")
      gsap.registerPlugin(ScrollTrigger)
      ctx = gsap.context(() => {
        document.querySelectorAll(".reveal").forEach((el) => {
          gsap.from(el, {
            y: 20,
            opacity: 0,
            duration: 0.55,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 90%" },
          })
        })
      }, mainRef)
    }
    init()
    return () => ctx?.revert()
  }, [])

  const handleConnectClick = () => setShowConfirmModal(true)
  const handleConfirmConnection = async () => {
    const walletAddress = await connectWallet()
    if (!walletAddress) throw new Error("cancelled")
    await login(walletAddress)
    if (userProfile) router.push("/dashboard")
    else setShowProfileSetup(true)
  }
  const handleProfileComplete = (name: string, avatar: string | null) => {
    setUserProfile({ name, avatar })
    setShowProfileSetup(false)
    router.push("/dashboard")
  }

  return (
    <div ref={mainRef} className="min-h-screen overflow-x-hidden bg-white">

      {/* ══ NAVBAR — navy + hex pattern ══════════════════════════════════ */}
      <header className="fixed top-0 inset-x-0 z-50 bg-deep-navy">
        <HexPattern id="hexnav" stroke="rgba(255,255,255,0.055)" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center gap-8">
          <a href="/" className="shrink-0">
            <img src="/GreenToken-assets/logo-white.svg" alt="GreenToken" className="h-6 w-auto" />
          </a>
          <nav className="hidden md:flex items-center gap-7 ml-auto">
            {[
              { label: "El problema", href: "#problema" },
              { label: "Cómo funciona", href: "#como-funciona" },
              { label: "FAQ", href: "#faq" },
            ].map((link) => (
              <a key={link.href} href={link.href} className="text-[13px] text-white/45 no-underline transition-colors duration-150 hover:text-white/90">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3 ml-4">
            <LanguageSelector />
            <a href="/login" className="hidden md:inline-flex items-center h-8 px-4 rounded-md text-xs font-semibold bg-brand-green text-white no-underline">
              Acceder a la plataforma
            </a>
          </div>
        </div>
      </header>

      {/* ══ HERO — split: headline left, CertCard right ══════════════════ */}
      <section className="pt-[120px] pb-[112px] bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

            {/* Left */}
            <div className="flex-1 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-green/[0.18] bg-brand-green/[0.04] mb-10">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                <span className="text-[11px] font-semibold text-brand-green tracking-[0.06em]">
                  Infraestructura de atributos ambientales · Testnet
                </span>
              </div>

              <h1 className="text-[clamp(2.2rem,5vw,3.5rem)] font-bold tracking-[-0.03em] leading-[1.06] text-deep-navy mb-7">
                Energía renovable<br />
                que puede{" "}
                <span className="text-brand-green">demostrarse.</span>
              </h1>

              <p className="text-[1.0625rem] leading-[1.72] text-brand-slate mb-10 max-w-[480px]">
                Convertimos la generación real de energía renovable en activos ambientales verificables.
                Cooperativas que documentan producción. Empresas que demuestran impacto.
                Una sola fuente de verdad.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-3">
                <a href="/login" className="inline-flex items-center gap-2 rounded-md font-semibold text-white bg-brand-green h-11 px-6 text-sm no-underline">
                  Acceder a la plataforma
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                </a>
                <a href="#como-funciona" className="inline-flex items-center rounded-md border h-11 px-6 text-sm text-deep-navy border-border no-underline">
                  Conocer cómo funciona
                </a>
              </div>
            </div>

            {/* Right — Certificate Card from brand */}
            <div className="shrink-0 w-full lg:w-auto reveal max-w-[340px]">
              <CertCard />
              {/* Metric tag below card */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Cada certificado
                </span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Trazable · Único · Inmutable
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══ EL PROBLEMA — dark navy + hex ════════════════════════════════ */}
      <section id="problema" className="relative overflow-hidden bg-deep-navy py-24">
        <HexPattern id="hexprob" stroke="rgba(255,255,255,0.055)" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-2xl reveal">
            <span className="block mb-7 text-[9px] font-semibold uppercase tracking-[0.22em] text-brand-green">
              Por qué existimos
            </span>
            <h2 className="text-[clamp(1.6rem,3.5vw,2.5rem)] font-bold tracking-[-0.025em] leading-[1.15] text-white mb-10">
              Hoy, demostrar el origen de la energía sigue siendo complejo.
            </h2>
            <div className="flex flex-col gap-5 text-[1.0625rem] leading-[1.72]">
              <p className="text-white/50">
                Cada vez más organizaciones quieren respaldar sus compromisos ambientales con evidencia real.
              </p>
              <p className="text-white/50">
                Sin embargo, el registro de energía renovable sigue dependiendo de procesos manuales,
                documentos aislados y datos difíciles de auditar por terceros.
              </p>
              <p className="text-white/50">
                Cuando la información no puede verificarse de forma independiente, la confianza se pierde.
              </p>
              <p className="font-semibold text-white/85">
                GreenToken existe para hacer visible lo que ya sucede: la generación real de energía limpia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ QUÉ ES GreenToken — white + phone mockup ═══════════════════════ */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col lg:flex-row items-start gap-16 lg:gap-24">

            {/* Left — text */}
            <div className="flex-1 max-w-xl reveal">
              <span className="block mb-7 text-[9px] font-semibold uppercase tracking-[0.22em] text-brand-green">
                Qué es GreenToken
              </span>
              <h2 className="text-[clamp(1.6rem,3.5vw,2.5rem)] font-bold tracking-[-0.025em] leading-[1.15] text-deep-navy mb-8">
                La infraestructura digital para registrar y verificar energía renovable.
              </h2>
              <p className="text-[1.0625rem] leading-[1.72] text-brand-slate mb-7">
                GreenToken es la infraestructura digital que convierte la generación real de energía renovable
                en registros verificables. Cada activo emitido conserva un historial que permite conocer:
              </p>
              <ul className="flex flex-col gap-3 mb-9">
                {["quién generó la energía", "cuándo fue producida", "cuánta energía representa", "cuál es su estado actual"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green shrink-0" />
                    <span className="text-[1.0625rem] text-deep-navy">{item}</span>
                  </li>
                ))}
              </ul>
              {/* Typography in context — from brand book */}
              <div className="rounded-lg bg-deep-navy p-5 md:p-6">
                <p className="text-[9px] text-white/30 uppercase tracking-[0.15em] mb-2">
                  Ejemplo de activo verificable
                </p>
                <p className="text-lg font-semibold text-white tracking-[-0.01em] mb-1">
                  152.4 MWh registrados
                </p>
                <p className="text-xs text-white/45 font-light">
                  Cooperativa Solar Andina · Testnet · Junio 2026
                </p>
              </div>
            </div>

            {/* Right — phone mockup */}
            <div className="shrink-0 flex justify-center reveal">
              <PhoneMockup />
            </div>

          </div>
        </div>
      </section>

      {/* ══ CÓMO FUNCIONA — cloud bg ══════════════════════════════════════ */}
      <section id="como-funciona" className="bg-cloud py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-xl mb-16 reveal">
            <span className="block mb-7 text-[9px] font-semibold uppercase tracking-[0.22em] text-brand-green">
              Cómo funciona
            </span>
            <h2 className="text-[clamp(1.6rem,3.5vw,2.5rem)] font-bold tracking-[-0.025em] leading-[1.15] text-deep-navy">
              Cuatro pasos. Un flujo de registro transparente.
            </h2>
          </div>

          <div className="max-w-[560px]">
            {STEPS.map((step, i) => (
              <div key={i} className="reveal flex gap-7 pb-10 relative">
                {i < STEPS.length - 1 && (
                  <div className="absolute left-[1.075rem] top-9 bottom-0 w-px bg-border" />
                )}
                <div className="shrink-0 w-9 h-9 rounded-full border-2 border-border bg-cloud flex items-center justify-center relative z-10">
                  <span className="text-[10px] font-bold text-deep-navy">{step.num}</span>
                </div>
                <div className="pt-1.5">
                  <p className="text-[15px] font-semibold text-deep-navy mb-1.5 tracking-[-0.01em]">
                    {step.title}
                  </p>
                  <p className="text-[13px] text-brand-slate leading-[1.65]">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BRAND PERSONALITY — exact from Brand Identity System ═════════ */}
      <section className="bg-deep-navy">
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-4">
          <span className="block mb-4 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/30">
            Por qué GreenToken
          </span>
        </div>
        <div className="grid grid-cols-3 max-w-7xl mx-auto px-6 md:px-12 pb-16">
          {PERSONALITY.map((p, i) => (
            <div key={i} className="reveal p-11"
              style={{
                borderTopWidth: i >= 3 ? "2px" : undefined,
                borderTopColor: i >= 3 ? "#1E293B" : undefined,
                borderLeftWidth: i % 3 !== 0 ? "1px" : undefined,
                borderLeftColor: i % 3 !== 0 ? "#1E293B" : undefined,
              }}>
              <div className="w-5 h-0.5 bg-brand-green mb-4" />
              <p className="text-[21px] font-light text-white tracking-[-0.01em] mb-2.5">
                {p.word}
              </p>
              <p className="text-[11px] leading-[1.75] text-white/[0.38] font-light">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ PARA QUIÉN — cloud bg ═════════════════════════════════════════ */}
      <section className="bg-cloud py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-xl mb-16 reveal">
            <h2 className="text-[clamp(1.6rem,3.5vw,2.5rem)] font-bold tracking-[-0.025em] leading-[1.15] text-deep-navy">
              ¿Para quién es?
            </h2>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {AUDIENCES.map((a, i) => (
              <div key={i} className="reveal rounded-xl p-7 bg-white border border-border">
                <p className="text-[15px] font-semibold text-deep-navy mb-2.5">{a.role}</p>
                <p className="text-[13px] text-brand-slate leading-[1.65]">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA — dark navy + hex ═════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-deep-navy py-24">
        <HexPattern id="hexcta" stroke="rgba(255,255,255,0.055)" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-2xl reveal">
            <span className="block mb-7 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/30">
              Qué sigue
            </span>
            <h2 className="text-[clamp(1.6rem,3.5vw,2.5rem)] font-bold tracking-[-0.025em] leading-[1.15] text-white mb-6">
              Empezá a registrar y verificar energía renovable.
            </h2>
            <p className="text-[1.0625rem] leading-[1.72] text-white/45 mb-10">
              Una infraestructura preparada para cooperativas que documentan producción
              y empresas que necesitan evidencia real de su impacto ambiental.
            </p>
            <a href="/login" className="inline-flex items-center gap-2 rounded-md font-semibold bg-solar-gold text-deep-navy h-11 px-6 text-sm no-underline">
              Solicitar una demo
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </section>

      {/* ══ FAQ — white ═══════════════════════════════════════════════════ */}
      <section id="faq" className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid gap-16 max-w-5xl" style={{ gridTemplateColumns: "1fr 2fr" }}>

            {/* Left sticky label */}
            <div className="reveal">
              <span className="block mb-7 text-[9px] font-semibold uppercase tracking-[0.22em] text-brand-green">
                Preguntas frecuentes
              </span>
              <h2 className="text-[clamp(1.4rem,2.8vw,1.875rem)] font-bold tracking-[-0.025em] text-deep-navy mb-5">
                Sobre los activos y el proceso.
              </h2>
              <a href="mailto:info@greentoken.coop" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-green text-[13px] no-underline">
                ¿Más preguntas? Contactanos
                <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
              </a>
            </div>

            {/* Right accordion */}
            <div>
              {FAQ.map((item, i) => (
                <div key={i} className="border-t border-border">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 py-5 text-left bg-transparent border-none cursor-pointer"
                  >
                    <span className="text-sm font-medium text-deep-navy">{item.q}</span>
                    <ChevronDown
                      className="shrink-0 w-4 h-4 text-slate-400 transition-transform duration-200"
                      style={{ transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)" }}
                    />
                  </button>
                  {openFaq === i && (
                    <p className="text-[13px] text-brand-slate leading-[1.7] pb-5 pr-8">
                      {item.a}
                    </p>
                  )}
                </div>
              ))}
              <div className="border-t border-border" />
            </div>

          </div>
        </div>
      </section>

      {/* ══ FOOTER — dark navy + hex ══════════════════════════════════════ */}
      <footer className="relative overflow-hidden bg-deep-navy py-9">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex items-center gap-5">
            {[
              {
                href: "https://linkedin.com/company/111951545",
                label: "LinkedIn",
                icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>,
              },
              {
                href: "https://x.com/GreenTokenCom",
                label: "X",
                icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
              },
              {
                href: "https://github.com/BuenDia-Builders/green-token",
                label: "GitHub",
                icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" /></svg>,
              },
            ].map(({ href, label, icon }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                className="text-white/25 transition-colors duration-150 hover:text-brand-green"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>
      </footer>

      <WalletConfirmationModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={handleConfirmConnection} />
      <ProfileSetupModal isOpen={showProfileSetup} onComplete={handleProfileComplete} />
    </div>
  )
}
