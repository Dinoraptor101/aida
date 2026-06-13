import { useLayoutEffect, useRef, useState } from 'react'
import { MarkedText, Working } from './Bits.jsx'
import { emotionStyle } from '../emotions.js'
import ReadCard from './ReadCard.jsx'
import Composer from './Composer.jsx'

// Normalise the message sender. Contract says "them" | "me"; the server stub
// historically emits "you" for the user — treat anything non-"them" as me.
const isThem = (from) => from === 'them'

export default function Thread({
  partner,
  pending, // an optimistic, still-reading incoming bubble: { text } | null
  onReceive,
  onCheck,
  onRewrite,
  onSend,
  onRepair,
  repairingId,
}) {
  const thread = partner?.thread || []
  const [openId, setOpenId] = useState(null) // which read card is expanded
  const scrollRef = useRef(null)

  // Keep the latest message in view as the thread grows.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [thread.length, pending, openId])

  // The most-recent incoming message is the one /repair targets.
  const lastIncomingId = (() => {
    for (let i = thread.length - 1; i >= 0; i--) {
      if (isThem(thread[i].from)) return thread[i].id
    }
    return null
  })()

  return (
    <>
      <div className="scroll" ref={scrollRef}>
        <div className="thread">
          {thread.length === 0 && !pending && (
            <div className="empty center">
              {partner?.baseline
                ? `Aida has learned how ${partner.name} writes. Paste a message they sent, or draft one to send.`
                : `Add a message ${partner?.name || 'they'} sent — Aida will start learning how they write.`}
            </div>
          )}

          {thread.map((m) => {
            const them = isThem(m.from)
            const read = m.read
            const grounded = read && read.grounded === true
            const emo = read ? emotionStyle(read.emotion, read.family) : null
            const markable = them && !!read
            const isOpen = openId === m.id

            return (
              <div key={m.id}>
                <div className={`row ${them ? 'them' : 'me'}`}>
                  <div
                    className={`bubble ${them ? 'them' : 'me'} ${markable ? 'readable' : ''}`}
                    style={emo && emo.color ? { '--emo': emo.color } : undefined}
                    onClick={markable ? () => setOpenId(isOpen ? null : m.id) : undefined}
                    role={markable ? 'button' : undefined}
                    tabIndex={markable ? 0 : undefined}
                    onKeyDown={
                      markable
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setOpenId(isOpen ? null : m.id)
                            }
                          }
                        : undefined
                    }
                    aria-expanded={markable ? isOpen : undefined}
                  >
                    {grounded ? (
                      <MarkedText text={m.text} span={read.chargedSpan} />
                    ) : (
                      m.text
                    )}

                    {markable && !isOpen && (
                      <span className={`read-cue ${grounded ? '' : 'learning'}`}>
                        <span className="cue-dot" aria-hidden="true" />
                        {grounded ? 'tap to read the subtext' : 'still learning how they write'}
                      </span>
                    )}
                  </div>
                </div>

                {markable && isOpen && (
                  <div className="row them">
                    <ReadCard
                      read={read}
                      repairing={repairingId === m.id}
                      onRepair={(note) => onRepair(m.id, note)}
                    />
                  </div>
                )}
              </div>
            )
          })}

          {/* Optimistic incoming bubble while Opus reads it. */}
          {pending && (
            <div>
              <div className="row them">
                <div className="bubble them">{pending.text}</div>
              </div>
              <div className="row-working">
                <Working label="Aida is reading this for you…" />
              </div>
            </div>
          )}
        </div>
      </div>

      <Composer
        onReceive={onReceive}
        onCheck={onCheck}
        onRewrite={onRewrite}
        onSend={onSend}
      />
    </>
  )
}
