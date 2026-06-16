import { useEffect, useState, useCallback } from 'react'
import { api } from './api.js'
import PartnerPicker from './components/PartnerPicker.jsx'
import Thread from './components/Thread.jsx'
import PerspectivePanel from './components/PerspectivePanel.jsx'
import { initials, Working } from './components/Bits.jsx'
import ToastHost from './components/ToastHost.jsx'
import { notify } from './toast.js'

// Normalise sender for memory we append optimistically.
const meMsg = (text, extra = {}) => ({
  id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  from: 'me',
  text,
  at: Date.now(),
  ...extra,
})

export default function App() {
  const [health, setHealth] = useState(null) // {ok, model} | {down:true} | null
  const [partners, setPartners] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')

  const [activeId, setActiveId] = useState(null)
  const [partner, setPartner] = useState(null) // full Partner for activeId
  const [partnerLoading, setPartnerLoading] = useState(false)
  const [partnerError, setPartnerError] = useState('')

  const [pending, setPending] = useState(null) // optimistic incoming bubble
  const [repairingId, setRepairingId] = useState(null)
  const [showTom, setShowTom] = useState(false) // "What Aida knows" panel open?

  // Health (quiet status line). Failure is non-fatal.
  useEffect(() => {
    let alive = true
    api
      .health()
      .then((h) => alive && setHealth(h))
      .catch(() => alive && setHealth({ down: true }))
    return () => {
      alive = false
    }
  }, [])

  const loadPartners = useCallback(async () => {
    setListLoading(true)
    setListError('')
    try {
      const list = await api.partners()
      setPartners(Array.isArray(list) ? list : [])
    } catch (err) {
      setListError(err.message || 'network error')
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPartners()
  }, [loadPartners])

  // Open a partner (load full thread + bank).
  const openPartner = useCallback(async (id) => {
    setActiveId(id)
    setPartner(null)
    setPending(null)
    setPartnerError('')
    setShowTom(false)
    setPartnerLoading(true)
    try {
      const p = await api.partner(id)
      setPartner(p)
    } catch (err) {
      setPartnerError(err.message || 'Could not open this conversation.')
    } finally {
      setPartnerLoading(false)
    }
  }, [])

  const back = () => {
    setActiveId(null)
    setPartner(null)
    setPending(null)
    setPartnerError('')
    setShowTom(false)
    loadPartners() // refresh counts/baseline flags
  }

  // Stable so PerspectivePanel's key/focus effects don't re-subscribe each render.
  const closeTom = useCallback(() => setShowTom(false), [])

  // Create a new partner and open them.
  const createPartner = useCallback(async (name, seedMessages) => {
    const p = await api.createPartner(name, seedMessages)
    await loadPartners()
    if (p && p.id) {
      setActiveId(p.id)
      setPartner(p)
      setPending(null)
      setPartnerError('')
    }
    return p
  }, [loadPartners])

  // RECEIVE — optimistic bubble, then attach the read the server returns.
  const onReceive = useCallback(
    async (text) => {
      if (!activeId) return
      setPending({ text })
      try {
        const read = await api.receive(activeId, text)
        const msg = {
          id: `in-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          from: 'them',
          text,
          read,
          at: Date.now(),
        }
        setPartner((prev) =>
          prev ? { ...prev, thread: [...(prev.thread || []), msg] } : prev
        )
      } catch (err) {
        notify('Aida couldn’t reach the reader just now — please try again.', { type: 'error' })
      } finally {
        setPending(null)
      }
    },
    [activeId]
  )

  const onCheck = useCallback(
    (draft) => {
      if (!activeId) return Promise.reject(new Error('no conversation open'))
      return api.check(activeId, draft)
    },
    [activeId]
  )

  const onRewrite = useCallback(
    (draft, intent) => {
      if (!activeId) return Promise.reject(new Error('no conversation open'))
      return api.rewrite(activeId, draft, intent)
    },
    [activeId]
  )

  // SEND — record the approved message; append it as a 'me' bubble.
  const onSend = useCallback(
    async (text) => {
      if (!activeId) return
      try {
        const sent = await api.send(activeId, text)
        const msg =
          sent && sent.id
            ? { ...sent, from: 'me', read: sent.read || undefined }
            : meMsg(text)
        setPartner((prev) =>
          prev ? { ...prev, thread: [...(prev.thread || []), msg] } : prev
        )
      } catch (err) {
        notify('Couldn’t send just now — please try again.', { type: 'error' })
      }
    },
    [activeId]
  )

  // REPAIR — update the displayed read on the most-recent incoming message.
  const onRepair = useCallback(
    async (messageId, note) => {
      if (!activeId) return
      setRepairingId(messageId)
      try {
        const res = await api.repair(activeId, note)
        const newRead = res && res.read ? res.read : null
        if (newRead) {
          setPartner((prev) => {
            if (!prev) return prev
            const thread = (prev.thread || []).map((m) =>
              m.id === messageId ? { ...m, read: newRead } : m
            )
            return { ...prev, thread }
          })
        }
      } catch (err) {
        notify('Couldn’t update that just now — please try again.', { type: 'error' })
      } finally {
        setRepairingId(null)
      }
    },
    [activeId]
  )

  const inThread = !!activeId

  return (
    <div className="app">
      <ToastHost />
      {!inThread ? (
        <>
          <header className="appbar">
            <div className="appbar-title">
              <span className="wordmark">
                Aida <span className="ma">間</span>
              </span>
              <span className="tagline">captions for emotional subtext</span>
            </div>
          </header>

          <StatusLine health={health} />

          <PartnerPicker
            partners={partners}
            loading={listLoading}
            error={listError}
            onOpen={openPartner}
            onCreate={createPartner}
          />
        </>
      ) : (
        <>
          <header className="appbar">
            <button className="back" onClick={back} aria-label="Back to your people">
              ‹
            </button>
            <button
              className="appbar-id"
              onClick={() => setShowTom(true)}
              disabled={!partner}
              aria-haspopup="dialog"
              aria-label={partner ? `What Aida knows about ${partner.name}` : 'opening'}
            >
              <span className="avatar" aria-hidden="true">
                {initials(partner?.name || '')}
              </span>
              <span className="appbar-title">
                <span className="name">{partner?.name || '…'}</span>
                <span className="sub">
                  {partner
                    ? partner.baseline
                      ? `what Aida knows about ${partner.name}`
                      : 'Aida is still learning how they write'
                    : 'opening…'}
                </span>
              </span>
              {partner && (
                <span className="tom-chevron" aria-hidden="true">
                  ›
                </span>
              )}
            </button>
          </header>

          {showTom && partner && (
            <PerspectivePanel
              partnerId={partner.id}
              partnerName={partner.name}
              onClose={closeTom}
            />
          )}

          {partnerLoading ? (
            <div className="boot">
              <Working label="opening…" />
            </div>
          ) : partnerError ? (
            <div className="scroll">
              <div className="banner">{partnerError}</div>
              <div className="pad">
                <button className="btn" onClick={() => openPartner(activeId)}>
                  Try again
                </button>
              </div>
            </div>
          ) : (
            <Thread
              partner={partner}
              pending={pending}
              onReceive={onReceive}
              onCheck={onCheck}
              onRewrite={onRewrite}
              onSend={onSend}
              onRepair={onRepair}
              repairingId={repairingId}
            />
          )}
        </>
      )}
    </div>
  )
}

function StatusLine({ health }) {
  if (!health) {
    return (
      <div className="status">
        <span className="dot" /> connecting…
      </div>
    )
  }
  if (health.down) {
    return (
      <div className="status">
        <span className="dot down" /> Aida’s reader is offline right now.
      </div>
    )
  }
  return (
    <div className="status">
      <span className="dot ok" /> ready{health.model ? ` · ${health.model}` : ''}
    </div>
  )
}
