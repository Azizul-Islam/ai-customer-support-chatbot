import Link from "next/link"
import {
  MessageSquareMore,
  Zap,
  Brain,
  Globe,
  BarChart3,
  Shield,
  ArrowRight,
  Check,
  Star,
  Sparkles,
  Bot,
  Code2,
  Headphones,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Knowledge",
    description:
      "Train your chatbot on docs, URLs, and PDFs. It learns your product deeply and answers with precision.",
    color: "text-violet-500",
    bg: "bg-violet-50",
  },
  {
    icon: Zap,
    title: "Deploy in Minutes",
    description:
      "No engineering required. Create, customize, and embed your support bot with a single script tag.",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    icon: Globe,
    title: "Multi-Channel Ready",
    description:
      "Embed on any website, app, or portal. Your bot works everywhere your customers are.",
    color: "text-sky-500",
    bg: "bg-sky-50",
  },
  {
    icon: BarChart3,
    title: "Conversation Analytics",
    description:
      "Track resolution rates, common questions, and satisfaction scores from one unified dashboard.",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "SSO authentication, role-based access, and data isolation built in from day one.",
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
  {
    icon: Code2,
    title: "API & Webhooks",
    description:
      "Integrate with your CRM, helpdesk, or custom backend using our clean REST API and webhooks.",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
]

const steps = [
  {
    number: "01",
    title: "Connect your knowledge",
    description:
      "Add your docs, website URLs, or upload PDFs. SupportIQ indexes everything automatically.",
  },
  {
    number: "02",
    title: "Customize your bot",
    description:
      "Set the name, tone, colors, and fallback behavior to match your brand perfectly.",
  },
  {
    number: "03",
    title: "Embed & go live",
    description:
      "Copy one script tag, paste it in your site, and your AI support agent is live instantly.",
  },
]

const testimonials = [
  {
    quote:
      "SupportIQ resolved 74% of our tier-1 tickets automatically within the first week. Our team finally has time to focus on complex issues.",
    author: "Sarah Chen",
    role: "Head of CX · Flowly",
    rating: 5,
  },
  {
    quote:
      "Setup took 20 minutes. The quality of answers blew us away — it actually understands context, not just keywords.",
    author: "Marcus Okafor",
    role: "CTO · Stackr",
    rating: 5,
  },
  {
    quote:
      "We replaced a whole FAQ section and a junior support role. Customers get instant, accurate help 24/7.",
    author: "Priya Nair",
    role: "Product Lead · Draftly",
    rating: 5,
  },
]

const plans = [
  {
    name: "Starter",
    price: "$29",
    description: "Perfect for small teams",
    features: ["1 chatbot", "5K messages/mo", "3 knowledge sources", "Basic analytics"],
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$99",
    description: "Scale your support",
    features: [
      "5 chatbots",
      "50K messages/mo",
      "Unlimited sources",
      "Advanced analytics",
      "SSO & team access",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations",
    features: [
      "Unlimited chatbots",
      "Unlimited messages",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
    ],
    cta: "Talk to sales",
    highlighted: false,
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
              <Bot className="size-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">SupportIQ</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              Get started free
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-violet-50 via-white to-white pb-24 pt-20">
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-violet-100 opacity-60 blur-3xl" />
            <div className="absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-100 opacity-50 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-medium text-violet-700">
              <Sparkles className="size-3.5" />
              AI-powered customer support, zero engineering effort
            </div>

            <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              Build smarter{" "}
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                support bots
              </span>
              <br />
              in minutes, not months
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 sm:text-xl">
              SupportIQ turns your knowledge base into an always-on AI support agent. Train it on
              your docs, deploy it to your site, and watch your ticket volume drop overnight.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-200 hover:opacity-90 transition-opacity"
              >
                Start building for free
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                See how it works
              </a>
            </div>

            <p className="mt-4 text-sm text-gray-400">No credit card required · Free 14-day trial</p>

            {/* Hero visual */}
            <div className="mx-auto mt-16 max-w-4xl">
              <div className="relative rounded-2xl border border-gray-200 bg-white p-1 shadow-2xl shadow-gray-200">
                <div className="rounded-xl bg-gray-50 p-6">
                  {/* Fake browser bar */}
                  <div className="mb-4 flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-emerald-400" />
                    <div className="ml-3 flex-1 rounded-md bg-gray-200 px-3 py-1 text-left text-xs text-gray-400">
                      app.supportiq.ai/chatbots
                    </div>
                  </div>

                  {/* Fake dashboard preview */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-3">
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="size-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                            <Bot className="size-4 text-white" />
                          </div>
                          <div>
                            <div className="h-3 w-24 rounded bg-gray-200" />
                            <div className="mt-1 h-2 w-16 rounded bg-gray-100" />
                          </div>
                          <div className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Live</div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-2 w-full rounded bg-gray-100" />
                          <div className="h-2 w-4/5 rounded bg-gray-100" />
                          <div className="h-2 w-3/5 rounded bg-gray-100" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[["74%", "Resolution rate"], ["2.3s", "Avg response"], ["12K", "Msgs this month"]].map(([val, label]) => (
                          <div key={label} className="rounded-lg border border-gray-200 bg-white p-3 text-center">
                            <div className="text-xl font-bold text-gray-900">{val}</div>
                            <div className="mt-0.5 text-xs text-gray-400">{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fake chat widget */}
                    <div className="rounded-lg border border-gray-200 bg-white p-3">
                      <div className="mb-2 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <div className="size-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500" />
                        <div className="text-xs font-semibold text-gray-700">Support Bot</div>
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      </div>
                      <div className="space-y-2">
                        <div className="rounded-lg rounded-tl-none bg-gray-100 px-2.5 py-1.5 text-xs text-gray-600">
                          Hi! How can I help you today?
                        </div>
                        <div className="ml-auto max-w-[80%] rounded-lg rounded-tr-none bg-violet-600 px-2.5 py-1.5 text-xs text-white">
                          How do I reset my password?
                        </div>
                        <div className="rounded-lg rounded-tl-none bg-gray-100 px-2.5 py-1.5 text-xs text-gray-600">
                          Sure! Go to Settings → Security → Reset password and follow the steps.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Social proof strip ── */}
        <section className="border-y border-gray-100 bg-gray-50 py-10">
          <div className="mx-auto max-w-7xl px-6">
            <p className="mb-6 text-center text-sm font-medium uppercase tracking-widest text-gray-400">
              Trusted by fast-growing teams
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
              {["Flowly", "Stackr", "Draftly", "Nexivo", "Relay", "Orbita"].map((name) => (
                <span key={name} className="text-xl font-bold text-gray-300">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">Features</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                Everything you need to support customers at scale
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                SupportIQ gives you the tools to automate, analyze, and improve customer support
                without hiring more agents.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className={`inline-flex size-11 items-center justify-center rounded-xl ${f.bg}`}>
                    <f.icon className={`size-5 ${f.color}`} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="bg-gradient-to-b from-gray-50 to-white py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">How it works</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                Live in three steps
              </h2>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {steps.map((s, i) => (
                <div key={s.number} className="relative">
                  {i < steps.length - 1 && (
                    <div className="absolute left-full top-8 hidden h-0.5 w-full -translate-x-4 bg-gradient-to-r from-violet-200 to-transparent md:block" />
                  )}
                  <div className="flex flex-col items-start">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-lg font-black text-white">
                      {s.number}
                    </div>
                    <h3 className="mt-5 text-xl font-bold text-gray-900">{s.title}</h3>
                    <p className="mt-2 text-base leading-relaxed text-gray-500">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">Testimonials</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                Customers love SupportIQ
              </h2>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {testimonials.map((t) => (
                <div
                  key={t.author}
                  className="flex flex-col rounded-2xl border border-gray-100 bg-white p-8 shadow-sm"
                >
                  <div className="flex gap-1">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 text-base leading-relaxed text-gray-600">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-sm font-bold text-white">
                      {t.author[0]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{t.author}</div>
                      <div className="text-xs text-gray-400">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="bg-gradient-to-b from-gray-50 to-white py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">Pricing</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                Simple, transparent pricing
              </h2>
              <p className="mt-4 text-lg text-gray-500">Start free. Scale as you grow.</p>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {plans.map((p) => (
                <div
                  key={p.name}
                  className={`relative flex flex-col rounded-2xl p-8 ${
                    p.highlighted
                      ? "bg-gradient-to-b from-violet-600 to-indigo-700 text-white shadow-2xl shadow-violet-200"
                      : "border border-gray-100 bg-white shadow-sm"
                  }`}
                >
                  {p.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-4 py-1 text-xs font-bold text-amber-900">
                      Most popular
                    </div>
                  )}
                  <div className={`text-sm font-semibold uppercase tracking-widest ${p.highlighted ? "text-violet-200" : "text-violet-600"}`}>
                    {p.name}
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className={`text-5xl font-extrabold ${p.highlighted ? "text-white" : "text-gray-900"}`}>
                      {p.price}
                    </span>
                    {p.price !== "Custom" && (
                      <span className={`text-sm ${p.highlighted ? "text-violet-200" : "text-gray-400"}`}>/mo</span>
                    )}
                  </div>
                  <p className={`mt-1 text-sm ${p.highlighted ? "text-violet-200" : "text-gray-400"}`}>
                    {p.description}
                  </p>

                  <ul className="mt-8 flex-1 space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <div className={`flex size-5 shrink-0 items-center justify-center rounded-full ${p.highlighted ? "bg-white/20" : "bg-violet-50"}`}>
                          <Check className={`size-3 ${p.highlighted ? "text-white" : "text-violet-600"}`} />
                        </div>
                        <span className={p.highlighted ? "text-violet-100" : "text-gray-600"}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/login"
                    className={`mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90 ${
                      p.highlighted
                        ? "bg-white text-violet-700"
                        : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm"
                    }`}
                  >
                    {p.cta}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-800 px-8 py-16 text-center shadow-2xl shadow-indigo-200">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white opacity-5" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white opacity-5" />

              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-violet-100">
                  <Headphones className="size-3.5" />
                  Join 2,000+ support teams
                </div>
                <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                  Ready to automate your support?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-violet-200">
                  Get your AI support agent running in under 30 minutes. No engineers, no long
                  contracts, no complexity.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-violet-700 shadow-lg hover:bg-violet-50 transition-colors"
                  >
                    Start your free trial
                    <ArrowRight className="size-4" />
                  </Link>
                  <a
                    href="mailto:hello@supportiq.ai"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    Talk to sales
                  </a>
                </div>
                <p className="mt-4 text-sm text-violet-300">14-day free trial · No credit card needed</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
                <Bot className="size-3.5 text-white" />
              </div>
              <span className="font-bold text-gray-900">SupportIQ</span>
            </div>

            <nav className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <a href="#features" className="hover:text-gray-600 transition-colors">Features</a>
              <a href="#pricing" className="hover:text-gray-600 transition-colors">Pricing</a>
              <Link href="/login" className="hover:text-gray-600 transition-colors">Sign in</Link>
              <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-600 transition-colors">Terms</a>
            </nav>

            <p className="text-sm text-gray-400">© 2026 SupportIQ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
