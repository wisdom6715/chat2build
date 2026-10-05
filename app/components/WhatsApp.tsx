'use client'

import { useEffect, useId, useRef, useState } from 'react'

type Topic = { label: string; message: string }

type WhatsAppSupportProps = {
  /** International format, digits only, no "+". Example: 2348012345678 */
  phone?: string
  /** Message used by the main "Start a chat" button */
  defaultMessage?: string
  /** Quick topics shown in the panel. Each opens WhatsApp with its own message. */
  topics?: Topic[]
}

const DEFAULT_TOPICS: Topic[] = [
  {
    label: 'Registration and payment',
    message: 'Hi Chat2Build team, I need help with registration and payment.',
  },
  {
    label: 'Curriculum and schedule',
    message: 'Hi Chat2Build team, I have a question about the curriculum and class schedule.',
  },
  {
    label: "I'm not a programmer. Is this for me?",
    message: "Hi Chat2Build team, I'm not a programmer. Is the bootcamp right for me?",
  },
  {
    label: 'Technical support',
    message: 'Hi Chat2Build team, I need technical support.',
  },
]

function buildLink(phone: string, message: string) {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
}

export function WhatsAppIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.18 2.095 3.195 5.076 4.483.709.3 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" className="h-4 w-4">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-white/50 transition group-hover:translate-x-0.5 group-hover:text-lemon">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export function WhatsAppSupport({
  phone = '+2349024531295',
  defaultMessage = 'Hi Chat2Build team, I have a question about the bootcamp.',
  topics = DEFAULT_TOPICS,
}: WhatsAppSupportProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const primaryRef = useRef<HTMLAnchorElement>(null)
  const panelId = useId()

  // Close on outside click and on Escape (returning focus to the trigger)
  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  // Move focus into the panel when it opens
  useEffect(() => {
    if (open) primaryRef.current?.focus()
  }, [open])

  if (!phone.replace(/\D/g, '')) return null

  return (
    <div
      ref={rootRef}
      className="fixed right-4 z-50 flex flex-col items-end gap-3 bottom-[max(1rem,env(safe-area-inset-bottom))] sm:right-6 sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      {/* Panel */}
      <div
        id={panelId}
        role="dialog"
        aria-label="Chat with Chat2Build support on WhatsApp"
        className={[
          'noise relative w-[min(330px,calc(100vw-2rem))] origin-bottom-right overflow-hidden rounded-2xl border border-white/10 bg-[#080981] p-5 text-white shadow-[0_24px_60px_-20px_rgba(8,9,129,.75)]',
          'transition-[opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none',
          open ? 'visible translate-y-0 scale-100 opacity-100' : 'invisible translate-y-2 scale-95 opacity-0',
        ].join(' ')}
      >
        {/* Same orbit rings as the CTA banner */}
        <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-[75%] rounded-[50%] border border-white/10" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-48 w-[80%] rounded-[50%] border border-white/10" />

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
                <WhatsAppIcon className="h-6 w-6" />
              </span>
              <h2 className="display text-[24px] leading-[.95]">
                Talk to the
                <br />
                <span className="font-sans font-black tracking-[-.06em]">Chat2Build team.</span>
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                triggerRef.current?.focus()
              }}
              aria-label="Close support panel"
              className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-lemon"
            >
              <CloseIcon />
            </button>
          </div>

          <p className="mt-4 text-[11px] leading-5 text-white/75">
            Pick a topic and WhatsApp opens with your message already written.
          </p>

          <ul className="mt-4 space-y-2">
            {topics.map((topic) => (
              <li key={topic.label}>
                <a
                  href={buildLink(phone, topic.message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 rounded-md border border-white/15 bg-white/5 px-3 py-2.5 text-[11px] font-bold transition hover:border-white/30 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lemon"
                >
                  {topic.label}
                  <ArrowIcon />
                </a>
              </li>
            ))}
          </ul>

          <a
            ref={primaryRef}
            href={buildLink(phone, defaultMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-lemon px-5 py-3 text-[11px] font-black text-[#080981] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:hover:translate-y-0"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Start a chat
          </a>

          <p className="mt-3 text-center text-[9px] text-white/60">
            Opens in the WhatsApp app or WhatsApp Web.
          </p>
        </div>
      </div>

      {/* Launcher */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="noise relative flex items-center gap-2.5 overflow-hidden rounded-xl border border-white/15 bg-[#090BC2] py-2 pl-2 pr-4 text-white shadow-[0_14px_34px_-12px_rgba(8,9,129,.85)] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lemon motion-reduce:hover:translate-y-0"
      >
        <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-[#25D366] text-white">
          <WhatsAppIcon className="h-5 w-5" />
        </span>
        <span className="relative text-[11px] font-black">{open ? 'Close' : 'Chat with us'}</span>
      </button>
    </div>
  )
}