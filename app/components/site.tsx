'use client'

import Image from 'next/image'
import { useState } from 'react'

const Arrow = ({ light = false }: { light?: boolean }) => (
  <svg aria-hidden="true" width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M3 12 12 3M5 3h7v7" stroke={light ? 'currentColor' : 'currentColor'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Check = () => (
  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#080981] text-[9px] font-bold text-white">✓</span>
)

const Chevron = ({ open }: { open: boolean }) => (
  <span className={`flex h-6 w-6 items-center justify-center rounded-full border border-line text-[#080981] transition-transform ${open ? 'rotate-180' : ''}`}>
    <svg aria-hidden="true" width="11" height="7" viewBox="0 0 11 7" fill="none"><path d="m1 1 4.5 4.5L10 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </span>
)

const Logo = ({ inverted = false }: { inverted?: boolean }) => (
  <a href="#top" className={`group inline-flex items-center gap-2 text-[14px] font-bold tracking-[-0.03em] ${inverted ? 'text-white' : 'text-ink'}`}>
    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#090BC2] text-[14px] font-black text-white shadow-[inset_0_-2px_0_rgba(0,0,0,.1)]">C</span>
    <span className="font-bold text-[16px]">Chat2Build</span>
  </a>
)

const SectionLabel = ({ children, yellow = false }: { children: React.ReactNode; yellow?: boolean }) => (
  <span className={`${yellow ? 'yellow-label' : 'section-label'} items-center `}>{children}</span>
)

export function Header() {
  const [open, setOpen] = useState(false)
  const links = [['About', '#about'], ['Features', '#features'], ['Pricing', '#pricing'], ['FAQ', '#faq'], ['Contact', '#contact']]
  return (
    <header className="absolute inset-x-0 top-0 z-20" id="top">
      <div className="shell flex h-[76px] items-center justify-between">
        <Logo />
        <nav className={`${open ? 'absolute left-6 right-6 top-[68px] flex flex-col rounded-2xl border border-line bg-white p-4 shadow-card' : 'hidden'} gap-1 md:static md:flex md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0 md:shadow-none`}>
          {links.map(([label, href]) => <a key={label} href={href} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-[14px] font-medium text-muted transition hover:bg-lavender hover:text-ink">{label}</a>)}
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          <a href="#pricing" className="rounded-md bg-[#090BC2] px-4 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#080981]-dark">Register Now</a>
        </div>
        <button aria-label="Toggle menu" className="flex h-9 w-9 items-center justify-center rounded-lg border border-line md:hidden" onClick={() => setOpen(!open)}>
          <span className="space-y-1.5"><span className="block h-px w-4 bg-ink" /><span className="block h-px w-4 bg-ink" /></span>
        </button>
      </div>
    </header>
  )
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pb-16 pt-36 sm:pb-24 sm:pt-44">
      <div className="shell text-center">
        <SectionLabel><Image src="/check.png" alt="Chat2Build" className="h-4 w-4 mr-2" width={50} height={50} />4-weeks bootcamp</SectionLabel>
        <h1 className="mx-auto mt-5 max-w-3xl text-[30px] font-semibold leading-[1.07] tracking-[-0.055em] text-[#090BC2] sm:text-[45px]">YOUR APP. <span className='ml-2'>BUILT WITH </span><span className='bg-lemon p-2 italic '>AI</span> </h1>
        <p className="display mx-auto mt-4 max-w-3xl text-[25px] leading-[1.08] text-ink sm:text-[35px]">From idea to App Store &amp; Google Play without learning to code.</p>
        <p className="muted-copy mx-auto mt-5 max-w-lg text-[12px] sm:text-[13px]">Learn how to build, test, and launch real web and mobile apps using<br className="hidden sm:block" /> AI-assisted software starting from zero.</p>
        <a href="#pricing" className="primary-button mt-6">Register Now</a>
        <div className="relative mx-auto mt-14 max-w-[960px] overflow-hidden rounded-2xl border border-[#ececf5] bg-[#f8f8fc] p-3 shadow-[0_20px_70px_rgba(29,25,185,.07)] sm:mt-16 sm:p-5">
          <div className="relative aspect-[1.85] overflow-hidden rounded-xl border border-white bg-white shadow-[0_2px_12px_rgba(17,23,47,.05)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(45,37,235,.16),transparent_22%),linear-gradient(112deg,#f9f9fc,#fff 48%,#fbfbff)]" />
            <div className="absolute left-[6%] top-[14%] h-[70%] w-[18%] border-r border-[#f0f0f5] text-left opacity-60">
              <div className="mb-4 h-2 w-10 rounded bg-[#dedff0]" />
              {[1,2,3,4,5,6].map((item) => <div key={item} className="mb-3 flex gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#e7e7f3]" /><span className="h-2 w-12 rounded bg-[#f1f1f7]" /></div>)}
            </div>
            <div className="absolute right-[7%] top-[15%] h-2 w-14 rounded bg-[#f3a1ac] opacity-80" />
            <div className="absolute left-[30%] top-[18%] h-3 w-[36%] rounded bg-[#f0f0f6]" />
            <div className="absolute left-[30%] top-[29%] h-2 w-[20%] rounded bg-[#f5f5f8]" />
            <div className="absolute left-[38%] top-[48%] h-2 w-[17%] rounded bg-[#e9e9f6]" />
            <div className="absolute left-[63%] top-[48%] h-2 w-[8%] rounded bg-[#dcdcf0]" />
            <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#080981]/10 shadow-[0_0_42px_rgba(42,32,230,.28)] sm:h-32 sm:w-32">
              <div className="ml-1 flex h-12 w-12 items-center justify-center rounded-full bg-[#090BC2] shadow-[0_8px_20px_rgba(23,18,198,.35)] sm:h-16 sm:w-16"><span className="ml-1 border-y-[10px] border-l-[17px] border-y-transparent border-l-white sm:border-y-[13px] sm:border-l-[21px]" /></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const learningCards = [
  { title: 'Debugging AI Generated Code', copy: 'Learn to read error messages, troubleshoot issues, and fix broken features without getting stuck.', image: '/lady.png', tag: 'learn the why' },
  { title: 'Deploying Your App Online', copy: 'Learn how to use GitHub, hosting platforms, and deployment tools to make your app accessible to real users.', image: '/publish.png', tag: 'ship it live' },
  { title: 'App Store & Play Store Launch', copy: 'Understand store requirements, common rejection reasons, and how to successfully publish your app on the App Store and Play Store.', image: '/appstore.png', tag: 'go public' },
]

export function LearningSection() {
  return (
    <section className="bg-lavender" id="features">
      <div className="shell section-space">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#090BC2]">the missing link</p><h2 className="mt-4 max-w-lg text-[23px] font-bold leading-tight tracking-[-0.045em] text-ink sm:text-[28px]">AI Can Generate Code.<br />Learn How To Fix Errors and Build Real Projects.</h2></div>
          <div className="max-w-sm md:text-right"><p className="muted-copy">You don&apos;t need comprehensive years to learn how to use AI to build and launch real web and mobile apps on the App Store and Google Play.</p><a href="#roadmap" className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold text-[#090BC2]">Learn More About the Program <Arrow /></a></div>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {learningCards.map((card) => <article key={card.title} className="soft-card overflow-hidden p-2 transition hover:-translate-y-1 hover:shadow-card"><div className="relative h-44 overflow-hidden rounded-xl bg-[#ddd]"><img src={card.image} alt="" className="h-full w-full object-cover transition duration-500 hover:scale-105" /><span className="absolute bottom-3 left-3 rounded bg-white/90 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-[#090BC2]">{card.tag}</span></div><div className="p-4 pb-5"><h3 className="text-[16px] font-bold tracking-[-0.04em] text-ink">{card.title}</h3><p className="mt-2 text-[11px] leading-5 text-muted">{card.copy}</p></div></article>)}
        </div>
      </div>
    </section>
  )
}

const roadmap = [
  { week: 'week 01', title: 'Idea & Design', copy: 'Scoping user stories with Claude, creating high-fidelity wireframes in v0, database schema diagrams, and product specs.', milestone: 'Interactive v0 Prototype', icon: '⌁' },
  { week: 'week 02', title: 'Mobile Conversion', copy: 'Making web business logic into cross-platform iOS & Android apps via Expo, native camera & biometric haptics APIs.', milestone: 'First TestFlight Beta Build', icon: '◫' },
  { week: 'week 03', title: 'Payments & Polish', copy: 'Stripe setup monetization, Apple Pay integration, offline caching, push notifications, and runtime performance optimization.', milestone: 'Verified N / S Checkout Flow', icon: '▣' },
  { week: 'week 04', title: 'Publish & Launch', copy: 'Packaging production release builds, passing app review on Apple & Google Play, analytics setup, and Product Hunt debut.', milestone: 'Public Store Status Approval', icon: '↗' },
]

export function RoadmapSection() {
  return <section className="bg-white" id="roadmap"><div className="shell section-space"><div className="mx-auto max-w-2xl text-center"><SectionLabel yellow>curriculum overview</SectionLabel><h2 className="display mt-5 text-[32px] leading-none text-ink sm:text-[39px]">Your Step-by-Step 6-Week Roadmap</h2><p className="muted-copy mx-auto mt-4 max-w-md">A step-by-step program that helps you turn your ideas into real apps and launch them on Playstore &amp; App Store.</p></div><div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2">{roadmap.map((item) => <article key={item.week} className="soft-card p-5 transition hover:border-[#080981]/30 hover:shadow-card"><div className="flex items-start justify-between"><span className="yellow-label">{item.week}</span><span className="text-lg text-[#080981]">{item.icon}</span></div><h3 className="mt-4 text-[16px] font-bold tracking-[-0.04em]">{item.title}</h3><p className="mt-2 min-h-[74px] text-[11px] leading-5 text-muted">{item.copy}</p><p className="mt-5 text-[9px] font-bold text-[#080981]">Milestone: {item.milestone}</p></article>)}</div></div></section>
}

const audiences = [
  ['Students & Recent Graduates', 'Have a business idea but no technical team? Learn how to build and launch your MVP using AI-powered tools.', '◒'],
  ['Entrepreneurs & Business Owners', 'Turn your ideas into digital products, automate business processes, and create solutions that help your business grow.', '◯'],
  ['Aspiring Startup Founders', 'Have a business idea but no technical team? Learn how to build and launch your MVP using AI-powered tools.', '◈'],
  ['NYSC Members & Job Seekers', 'Build practical skills, create real-world projects, and improve your chances of securing internships and job opportunities.', '◌'],
  ['Small Business Owners', 'Build custom tools, websites, and mobile apps that help you streamline operations and serve customers better.', '○'],
  ['AI Enthusiasts', 'Go beyond using AI for simple tasks and learn how to build real products powered by AI.', '✧'],
]

export function AudienceSection() {
  return <section className="bg-white" id="about"><div className="shell section-space pt-4 sm:pt-10"><div className="mx-auto max-w-2xl text-center"><SectionLabel yellow>who this bootcamp is for</SectionLabel><h2 className="display mt-5 text-[32px] leading-none text-ink sm:text-[39px]">You don&apos;t need to be a programmer.</h2><p className="muted-copy mx-auto mt-4 max-w-lg">Designed for complete beginners who want to turn ideas into real web and mobile apps.</p></div><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{audiences.map(([title, copy, icon]) => <article key={title} className="soft-card flex gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-card"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lavender text-lg text-[#080981]">{icon}</div><div><h3 className="text-[12px] font-bold tracking-[-0.02em]">{title}</h3><p className="mt-1.5 text-[10px] leading-4 text-muted">{copy}</p></div></article>)}</div></div></section>
}

const benefits = ['Guaranteed 4-week bootcamp immersion', 'Weekly 3 days live mentor Q&A & architecture teardowns', 'Step-by-step App Store & Google Play walkthrough', 'Direct 1-on-1 code debugging support', 'Lifetime curriculum updates & Recorded Class Walkthrough', 'Access to private community of builders & mentors', 'No hidden fees or extra charges', 'Active 24/7 Support tutor to guide you through the program']

export function PricingSection() {
  return <section className="border-y border-line bg-[#fcfcff]" id="pricing"><div className="shell section-space"><div className="mx-auto max-w-2xl text-center"><SectionLabel>register now</SectionLabel><h2 className="display mt-5 text-[31px] leading-none text-ink sm:text-[39px]">Get Started with our Recommended Plan</h2><p className="muted-copy mt-4">Less than 5% of what agencies charge for a preliminary prototype.</p></div><article className="relative mx-auto mt-10 max-w-[360px] rounded-2xl border-2 border-[#080981] bg-white p-5 shadow-[0_18px_40px_rgba(23,18,198,.12)] sm:p-6"><span className="absolute -right-1 -top-3 rounded-full bg-lemon px-3 py-1 text-[6px] font-black uppercase tracking-wider text-ink">Build your first web app and mobile app with AI</span><p className="text-[9px] font-black uppercase tracking-wider text-[#080981]">comprehensive track</p><h3 className="mt-3 text-[22px] font-bold tracking-[-0.04em]">Registration</h3><div className="mt-3 flex items-end gap-2"><span className="text-[28px] font-black tracking-[-0.06em]">₦30,000</span><span className="mb-1 text-[10px] text-muted">one-time payment</span></div><p className="mt-1 text-[10px] text-muted">All-inclusive package with zero hidden charges.</p>
    <ul className="mt-6 space-y-3">{benefits.map((benefit) => <li key={benefit} className="flex gap-2 text-[10px] leading-4 text-ink"><Check />{benefit}</li>)}</ul>
    <a href="#contact" className="primary-button mt-6 w-full">Register Now</a>
    </article>
    </div>
  </section>
}

const team = [
  { name: 'Olayiwola Ibrahim', role: 'Founder / Lead Marketer', initials: 'OI', tone: 'from-[#d9ddff] to-[#f5e7cb]' },
  { name: 'Olayiwola Ibrahim', role: 'Co-Founder', initials: 'OI', tone: 'from-[#efe7ff] to-[#d4f1f0]' },
  { name: 'Usman Mubarak', role: 'Product Designer', initials: 'UM', tone: 'from-[#ffe5d3] to-[#d8e7ff]' },
]

export function TeamSection() {
  return <section className="bg-white" id="contact"><div className="shell section-space pt-0"><div className="mx-auto max-w-2xl text-center"><SectionLabel>our team</SectionLabel><h2 className="display mt-5 text-[31px] leading-none text-ink sm:text-[39px]">The People Behind Chat2Build</h2><p className="muted-copy mx-auto mt-4 max-w-lg">Meet the passionate team focused on building smarter and more accessible learning experiences for students &amp; professionals.</p></div><div className="mt-12 grid gap-5 sm:grid-cols-3">{team.map((member) => <article key={`${member.name}-${member.role}`} className={`relative h-64 overflow-hidden rounded-2xl bg-gradient-to-br ${member.tone} p-2`}><div className="flex h-full items-center justify-center"><span className="font-display text-[74px] tracking-[-.1em] text-white/70">{member.initials}</span></div><div className="absolute inset-x-2 bottom-2 rounded-xl bg-white/95 p-3"><h3 className="text-[12px] font-bold">{member.name}</h3><p className="mt-0.5 text-[9px] tracking-[.04em] text-muted">{member.role}</p></div></article>)}</div></div></section>
}

const faqs = [
  ['Do I need any previous coding knowledge?', 'No. The bootcamp is designed for complete beginners. You will learn how to think through a product, prompt AI well, and make sense of the code it generates.'],
  ['What tools will we use? (Antigravity Agent, Stitch, Android Studio, Firebase, Flutter, Github)', 'We use a focused, beginner-friendly toolkit: Antigravity Agent, Stitch, Android Studio, Firebase. You will leave with a repeatable workflow, not a pile of disconnected tools.'],
  ['Will my app actually get published to stores?', 'Yes. The final weeks are structured around production readiness, store assets, review requirements, and the submission workflow for both Apple and Google.'],
  ['Will there be 24/7 Technical Services Support?', 'You will have access to the community, recorded walkthroughs, and direct debugging support throughout the immersion so you are never left alone with a blocker.'],
]

export function FaqSection() {
  const [active, setActive] = useState<number | null>(null)
  return <section className="bg-white" id="faq"><div className="shell section-space pt-0"><div className="mx-auto max-w-2xl text-center"><SectionLabel>frequently asked questions</SectionLabel><h2 className="display mt-5 text-[31px] leading-none text-ink sm:text-[39px]">Got Questions? Read The FAQs</h2><p className="muted-copy mt-4">Find answers to the most common questions we get from prospective builders.</p></div><div className="mx-auto mt-10 max-w-2xl divide-y divide-line border-y border-line">{faqs.map(([question, answer], index) => { const isOpen = active === index; return <div key={question}><button className="flex w-full items-center justify-between gap-4 py-5 text-left text-[11px] font-bold text-ink" aria-expanded={isOpen} onClick={() => setActive(isOpen ? null : index)}><span>{question}</span><Chevron open={isOpen} /></button>{isOpen && <p className="-mt-1 pb-5 pr-10 text-[11px] leading-5 text-muted">{answer}</p>}</div> })}</div><p className="mt-8 text-center text-[10px] text-muted">Have more questions? Reach us directly at <a href="mailto:customersupport@chat2build.io" className="font-bold text-[#080981] underline">customersupport@chat2build.io</a></p></div></section>
}

export function CtaBanner() {
  return (
    <section className="px-4 pb-14 sm:px-6">
      <div className="noise relative mx-auto max-w-[1300px] overflow-hidden rounded-2xl bg-[url('/ctabanner.png')] bg-[#080981] bg-cover bg-center bg-no-repeat px-6 py-16 text-center text-white sm:px-12">
        <div className="relative">
          <h2 className="display text-[31px] leading-[.95] sm:text-[42px]">
            Stop dreaming about your app.<br />
            <span className="font-sans font-black tracking-[-.06em]">Start shipping it.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[11px] leading-5 text-white/75">
            Join 378+ builders in the upcoming Chat2Build Bootcamp and launch your software into real production.
          </p>
          <a href="#pricing" className="mt-6 inline-flex items-center gap-2 rounded-md bg-lemon px-5 py-3 text-[11px] font-black text-[#080981] transition hover:-translate-y-0.5">
            Register Now
          </a>
          <p className="mt-5 text-[9px] text-white/60">♙ Guaranteed Technical Support until your app is live.</p>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return <footer className="bg-white pb-8"><div className="shell grid gap-10 border-b border-line pb-10 pt-5 sm:grid-cols-[1.5fr_1fr_1fr] sm:gap-16"><div><Logo /><p className="mt-4 max-w-xs text-[10px] leading-5 text-muted">Chat2Build helps in empowering non-programmers and domain experts to build, launch, and publish production-ready web and mobile applications with AI.</p><div className="mt-4 flex gap-3 text-[11px] text-muted"><a href="#top" aria-label="X">𝕏</a><a href="#top" aria-label="Facebook">◉</a><a href="#top" aria-label="LinkedIn">in</a><a href="#top" aria-label="Instagram">◎</a></div></div><div><h3 className="text-[10px] font-bold uppercase tracking-[.1em] text-[#080981]">Product</h3><div className="mt-4 space-y-3 text-[10px] text-muted"><a className="block hover:text-ink" href="#roadmap">Curriculum Overview</a><a className="block hover:text-ink" href="#roadmap">4-Week Roadmap</a><a className="block hover:text-ink" href="#features">Features</a><a className="block hover:text-ink" href="#faq">FAQs</a></div></div><div><h3 className="text-[10px] font-bold uppercase tracking-[.1em] text-[#080981]">Resources &amp; Legal</h3><div className="mt-4 space-y-3 text-[10px] text-muted"><a className="block hover:text-ink" href="#faq">Student FAQ</a><a className="block hover:text-ink" href="#top">Terms of Service</a><a className="block hover:text-ink" href="#top">Privacy Policy</a><a className="block hover:text-ink" href="#top">Blog</a></div></div></div><div className="shell flex flex-col justify-between gap-3 pt-6 text-[9px] text-muted sm:flex-row"><span>© 2026 Chat2Build Bootcamp. All rights reserved.</span><span>Crafted by Usman Mubarak.</span></div></footer>
}
