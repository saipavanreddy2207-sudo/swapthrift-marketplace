import { ArrowLeft, Info, MessageCircle, Send, Wifi, WifiOff } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import { Loader } from '../components/Loader'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import conversationsService from '../services/conversations'
import productsService, { normaliseProduct } from '../services/products'
import { createChatSocket } from '../services/realtime'
import { apiErrorMessage } from '../utils/apiError'
import { getId, normaliseConversation, normaliseMessage } from '../utils/entities'
import { displayName, formatDate, getImageUrl, truncate } from '../utils/format'

const MESSAGE_LIMIT = 50

function isOwnMessage(message, user) {
  if (message.senderId) return message.senderId === getId(user?.id)
  return Boolean(message.own ?? message.isOwn ?? message.fromSelf ?? message.isMine)
}

export default function Messages() {
  const { user, isAuthenticated } = useAuth()
  const { error: toastError } = useToast()
  const [params] = useSearchParams()
  const productParam = params.get('product')
  const sellerParam = params.get('seller')

  const [conversations, setConversations] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [messages, setMessages] = useState([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [conversationError, setConversationError] = useState('')
  const [messageError, setMessageError] = useState('')
  const [setupError, setSetupError] = useState('')
  const [sending, setSending] = useState(false)
  const [draft, setDraft] = useState('')
  const [socketState, setSocketState] = useState('connecting')

  const mountedRef = useRef(true)
  const selectedRef = useRef('')
  const creationRef = useRef('')
  const pendingCreationRef = useRef('')
  const threadRef = useRef(null)

  useEffect(() => {
    selectedRef.current = selectedId
  }, [selectedId])

  const refreshConversations = useCallback(async () => {
    try {
      const list = await conversationsService.list()
      if (!mountedRef.current) return
      const normalised = list.map((entry) => normaliseConversation(entry, user?.id)).filter(Boolean)
      setConversations(normalised)
      setConversationError('')
      return normalised
    } catch (error) {
      if (mountedRef.current) setConversationError(apiErrorMessage(error))
      return []
    }
  }, [user?.id])

  const refreshMessages = useCallback(async (id, { silent = false } = {}) => {
    if (!id) return
    if (!silent) setLoadingMessages(true)
    try {
      const { messages: incoming } = await conversationsService.messages(id, {
        page: 1,
        limit: MESSAGE_LIMIT,
      })
      if (!mountedRef.current || selectedRef.current !== id) return
      setMessages(incoming.map(normaliseMessage))
      if (!silent) setMessageError('')
    } catch (error) {
      if (!silent && mountedRef.current && selectedRef.current === id) {
        setMessageError(apiErrorMessage(error))
      }
    } finally {
      if (!silent && mountedRef.current) setLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  /* oxlint-disable react/set-state-in-effect -- Ladezustand der Gesprächsliste ist eine Synchronisierung mit der Authentifizierung. */
  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingConversations(false)
      return
    }
    setLoadingConversations(true)
    refreshConversations().finally(() => {
      if (mountedRef.current) setLoadingConversations(false)
    })
  }, [isAuthenticated, refreshConversations])
  /* oxlint-enable react/set-state-in-effect */

  // Deep link from ProductDetails: select an existing chat or create one for this article.
  useEffect(() => {
    if (!isAuthenticated || !productParam || loadingConversations) return undefined
    let active = true
    async function prepareConversation() {
      setSetupError('')
      let sellerId = sellerParam ? getId(sellerParam) : ''
      if (!sellerId) {
        try {
          const product = await productsService.get(productParam)
          sellerId = getId(normaliseProduct(product)?.seller)
        } catch (error) {
          if (active) setSetupError(apiErrorMessage(error))
        }
      }
      if (!active) return
      if (!sellerId) {
        if (!sellerParam) {
          setSetupError('Die Verkäufer:in konnte nicht ermittelt werden. Bitte nutze die Kontakt-Schaltfläche im Inserat.')
        }
        return
      }
      if (sellerId === getId(user?.id)) {
        setSetupError('Dieses Angebot stammt von dir. Du kannst dir selbst keine Nachricht schreiben.')
        return
      }

      const key = `${getId(productParam)}:${sellerId}`
      if (creationRef.current === key || pendingCreationRef.current === key) return
      const existing = conversations.find(
        (conversation) =>
          getId(conversation.product) === getId(productParam) &&
          getId(conversation.participant) === sellerId,
      )
      if (existing?.id) {
        creationRef.current = key
        setSelectedId(existing.id)
        return
      }

      // Keep the pending marker until selection completes so StrictMode's second
      // effect invocation cannot skip the in-flight creation.
      pendingCreationRef.current = key
      try {
        const payload = await conversationsService.create(productParam, sellerId)
        const created = normaliseConversation(payload?.conversation ?? payload, user?.id)
        const fresh = await refreshConversations()
        const target =
          fresh.find(
            (entry) =>
              getId(entry.product) === getId(productParam) && getId(entry.participant) === sellerId,
          ) ?? created
        if (target?.id) {
          setConversations((current) => [target, ...current.filter((entry) => entry.id !== target.id)])
          setSelectedId(target.id)
        }
        creationRef.current = key
      } catch (error) {
        if (active) setSetupError(apiErrorMessage(error))
      } finally {
        pendingCreationRef.current = ''
      }
    }
    prepareConversation()
    return () => {
      active = false
    }
  }, [isAuthenticated, productParam, sellerParam, loadingConversations, conversations, user?.id, refreshConversations])

  /* oxlint-disable react/set-state-in-effect -- Auswahlwechsel setzt den Nachrichtenverlauf synchron zurück. */
  useEffect(() => {
    if (!selectedId || !isAuthenticated) return
    setMessageError('')
    setMessages([])
    refreshMessages(selectedId)
    conversationsService
      .markRead(selectedId)
      .then(() => {
        if (!mountedRef.current) return
        setConversations((current) =>
          current.map((entry) => (entry.id === selectedId ? { ...entry, unreadCount: 0 } : entry)),
        )
      })
      .catch((error) => toastError(apiErrorMessage(error)))
  }, [selectedId, isAuthenticated, refreshMessages, toastError])
  /* oxlint-enable react/set-state-in-effect */

  useEffect(() => {
    const element = threadRef.current
    if (element) element.scrollTop = element.scrollHeight
  }, [messages.length, selectedId])

  useEffect(() => {
    if (!isAuthenticated) return undefined
    const socket = createChatSocket()
    socket.on('connect', () => mountedRef.current && setSocketState('connected'))
    socket.on('disconnect', () => mountedRef.current && setSocketState('disconnected'))
    socket.on('connect_error', () => mountedRef.current && setSocketState('disconnected'))
    socket.on('message:new', (payload) => {
      const conversationId = getId(payload?.conversationId ?? payload?.conversation?.id ?? payload?.message?.conversation)
      const message = normaliseMessage(payload?.message)
      if (!conversationId || (!message.id && !message.text)) return
      if (mountedRef.current) {
        if (conversationId === selectedRef.current) {
          setMessages((current) => (current.some((entry) => entry.key === message.key) ? current : [...current, message]))
        } else {
          setConversations((current) =>
            current.map((entry) =>
              entry.id === conversationId
                ? {
                    ...entry,
                    unreadCount: Number(entry.unreadCount ?? 0) + 1,
                    lastMessage: message,
                    updatedAt: message.createdAt ?? entry.updatedAt,
                  }
                : entry,
            ),
          )
        }
      }
      refreshConversations()
      if (conversationId === selectedRef.current) refreshMessages(selectedRef.current, { silent: true })
    })
    socket.on('notification:new', () => refreshConversations())
    return () => {
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [isAuthenticated, refreshConversations, refreshMessages])

  // HTTP fallback so new messages still appear when the socket is unavailable.
  useEffect(() => {
    if (!isAuthenticated) return undefined
    const timer = window.setInterval(() => {
      refreshConversations()
      if (selectedRef.current) refreshMessages(selectedRef.current, { silent: true })
    }, 20000)
    return () => window.clearInterval(timer)
  }, [isAuthenticated, refreshConversations, refreshMessages])

  async function handleSend(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || !selectedId || sending) return
    setSending(true)
    try {
      const payload = await conversationsService.send(selectedId, text)
      if (mountedRef.current) {
        if (payload?.message) {
          const message = normaliseMessage(payload.message)
          setMessages((current) => (current.some((entry) => entry.key === message.key) ? current : [...current, message]))
        } else {
          await refreshMessages(selectedId, { silent: true })
        }
        setDraft('')
      }
      refreshConversations()
    } catch (error) {
      toastError(apiErrorMessage(error))
    } finally {
      if (mountedRef.current) setSending(false)
    }
  }

  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? null

  return (
    <div className="container-x py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold tracking-widest text-brand-600 uppercase">Kommunikation</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Nachrichten</h1>
          <p className="mt-2 text-sm text-slate-600">Sprich direkt mit Verkäufer:innen über Angebote und Übergaben.</p>
        </div>
        <span className={`badge ${socketState === 'connected' ? 'bg-brand-50 text-brand-800' : 'bg-slate-100 text-slate-600'}`}>
          {socketState === 'connected' ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
          {socketState === 'connected'
            ? 'Chat-Server verbunden'
            : socketState === 'connecting'
              ? 'Verbindung wird aufgebaut …'
              : 'Live-Chat nicht erreichbar – HTTP-Fallback aktiv'}
        </span>
      </div>

      {productParam && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <p className="text-sm font-semibold text-brand-950">
            Unterhaltung zum Artikel {selected?.product?.title ? `„${selected.product.title}“` : ''}
          </p>
          <Link to={`/produkt/${encodeURIComponent(productParam)}`} className="btn-outline px-3 py-2 text-xs">
            <ArrowLeft className="size-4" /> Zum Angebot
          </Link>
        </div>
      )}

      {setupError && <div role="alert" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{setupError}</div>}

      <div className="grid min-h-[32rem] overflow-hidden rounded-2xl border border-brand-900/8 bg-white md:grid-cols-[320px_1fr]">
        <aside className="border-b border-brand-900/8 p-4 md:border-r md:border-b-0">
          <h2 className="mb-4 text-sm font-extrabold">Unterhaltungen</h2>
          {loadingConversations ? (
            <Loader label="Unterhaltungen werden geladen …" />
          ) : conversationError ? (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">{conversationError}</p>
              <button type="button" onClick={refreshConversations} className="btn-outline mt-3 px-3 py-1.5 text-xs">Erneut versuchen</button>
            </div>
          ) : conversations.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title="Noch keine Unterhaltungen"
              description="Sobald du eine Verkäufer:in kontaktierst, erscheint die Unterhaltung hier."
              to="/marktplatz"
              actionLabel="Angebote entdecken"
            />
          ) : (
            <ul className="space-y-2">
              {conversations.map((conversation) => {
                const last = normaliseMessage(conversation.lastMessage)
                const image = getImageUrl(conversation.product?.images?.[0])
                return (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(conversation.id)}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                        conversation.id === selectedId ? 'border-brand-600 bg-brand-50' : 'border-transparent hover:bg-sand-50'
                      }`}
                    >
                      <span className="size-11 shrink-0 overflow-hidden rounded-xl bg-sand-100">
                        {image ? <img src={image} alt="" className="size-full object-cover" /> : <span className="grid size-full place-items-center text-brand-600"><MessageCircle className="size-5" /></span>}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-extrabold text-brand-950">
                          {displayName(conversation.participant)}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {conversation.product?.title || 'Angebot'}
                        </span>
                        <span className="mt-1 block truncate text-xs text-slate-500">
                          {last.text ? truncate(last.text, 60) : 'Noch keine Nachrichten'}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        {conversation.updatedAt && (
                          <span className="text-[10px] text-slate-400">
                            {formatDate(conversation.updatedAt, { day: '2-digit', month: '2-digit', year: undefined })}
                          </span>
                        )}
                        {conversation.unreadCount > 0 && (
                          <span className="grid min-w-5 place-items-center rounded-full bg-brand-700 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>

        <div className="flex min-h-[30rem] flex-col">
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-700"><MessageCircle className="size-7" /></span>
              <p className="mt-4 font-extrabold text-brand-950">Wähle eine Unterhaltung</p>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Hier kannst du Nachrichten lesen und beantworten. Es werden nur echte Unterhaltungen aus deinem Konto angezeigt.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-brand-900/8 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-100 font-extrabold text-brand-800">
                  {displayName(selected.participant).charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-brand-950">{displayName(selected.participant)}</p>
                  {selected.product?.id && (
                    <Link to={`/produkt/${encodeURIComponent(selected.product.id)}`} className="block truncate text-xs text-brand-700 hover:underline">
                      {selected.product.title || 'Zum Angebot'}
                    </Link>
                  )}
                </div>
              </div>

              {messageError && <div role="alert" className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{messageError}</div>}

              <div ref={threadRef} className="flex-1 space-y-3 overflow-y-auto bg-sand-50 p-4" style={{ maxHeight: '28rem' }}>
                {loadingMessages ? (
                  <Loader label="Nachrichten werden geladen …" />
                ) : messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-500">Noch keine Nachrichten in dieser Unterhaltung.</p>
                ) : (
                  messages.map((message) => {
                    const own = isOwnMessage(message, user)
                    return (
                      <div key={message.key ?? message.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${own ? 'rounded-br-sm bg-brand-800 text-white' : 'rounded-bl-sm border border-brand-900/8 bg-white text-slate-800'}`}>
                          <p className="whitespace-pre-wrap break-words">{message.text || 'Leere Nachricht'}</p>
                          {message.createdAt && (
                            <p className={`mt-1 text-[10px] ${own ? 'text-brand-100' : 'text-slate-400'}`}>
                              {formatDate(message.createdAt, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <form onSubmit={handleSend} className="border-t border-brand-900/8 p-4">
                <div className="flex gap-2">
                  <label className="sr-only" htmlFor="message-draft">Nachrichtentwurf</label>
                  <input
                    id="message-draft"
                    className="input"
                    placeholder="Nachricht schreiben …"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    maxLength={2000}
                  />
                  <button type="submit" disabled={!draft.trim() || sending} className="btn-primary px-3" aria-label="Nachricht senden">
                    <Send className="size-4" />
                  </button>
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
                  <Info className="mt-0.5 size-3.5 shrink-0" />
                  {socketState === 'connected'
                    ? 'Nachrichten kommen live an. Bei Verbindungsproblemen werden sie zusätzlich regelmäßig nachgeladen.'
                    : 'Der Live-Chat ist nicht erreichbar. Nachrichten werden trotzdem übermittelt; neue Nachrichten erscheinen nach kurzer Zeit.'}
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
