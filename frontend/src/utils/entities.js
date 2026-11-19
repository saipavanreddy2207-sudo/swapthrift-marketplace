import { normaliseProduct } from '../services/products'
import { displayName } from './format'

/** Ids arrive as strings, numbers or populated objects depending on the endpoint. */
export function getId(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    return String(value.id ?? value._id ?? value.userId ?? value.productId ?? '')
  }
  return String(value)
}

function asProduct(value) {
  if (!value) return null
  const product = typeof value === 'object' ? normaliseProduct(value) : normaliseProduct({ id: value })
  return product?.id ? product : null
}

function otherParticipant(conversation, currentUserId) {
  const candidates = [
    ...(Array.isArray(conversation?.participants) ? conversation.participants : []),
    ...(Array.isArray(conversation?.users) ? conversation.users : []),
    conversation?.participant,
    conversation?.otherUser,
    conversation?.otherParticipant,
    conversation?.receiver,
    conversation?.seller,
    conversation?.buyer,
    conversation?.user,
  ]
  const other = candidates.find((entry) => entry && getId(entry) !== String(currentUserId ?? ''))
  return other ?? null
}

/** Avoid showing "Mein Konto" for a populated seller/buyer that has no name fields. */
export function personLabel(value) {
  if (!value) return 'Nicht angegeben'
  if (typeof value !== 'object') return `ID ${value}`
  const name = displayName(value)
  if (name === 'Mein Konto') {
    return value.email || (getId(value) ? `ID ${getId(value)}` : 'Nicht angegeben')
  }
  return name
}

export function normaliseConversation(conversation, currentUserId) {
  if (!conversation || typeof conversation !== 'object') return null
  const lastRaw = conversation.lastMessage ?? conversation.latestMessage ?? conversation.last_message ?? null
  const lastMessage = typeof lastRaw === 'object' && lastRaw ? normaliseMessage(lastRaw) : lastRaw
  return {
    ...conversation,
    id: getId(conversation),
    product: asProduct(conversation.product ?? conversation.listing ?? conversation.productId),
    participant: otherParticipant(conversation, currentUserId),
    lastMessage,
    unreadCount: Number(conversation.unreadCount ?? conversation.unread ?? 0) || 0,
    updatedAt: conversation.updatedAt ?? conversation.lastMessageAt ?? conversation.createdAt ?? null,
  }
}

export function normaliseMessage(message) {
  if (!message || typeof message !== 'object') {
    return { id: null, text: String(message ?? ''), sender: null, senderId: '', createdAt: null }
  }
  const sender = message.sender ?? message.user ?? message.from ?? message.senderId ?? null
  const senderId = getId(sender)
  const createdAt = message.createdAt ?? message.created_at ?? message.timestamp ?? message.sentAt ?? null
  const text = String(message.text ?? message.body ?? message.content ?? '')
  const id = getId(message)
  return {
    ...message,
    id: id || null,
    key: id || `${senderId}:${createdAt ?? ''}:${text}`,
    sender,
    senderId,
    text,
    createdAt,
  }
}

const ORDER_STATUS_LABELS = {
  pending: 'Ausstehend',
  awaiting_payment: 'Zahlung ausstehend',
  unpaid: 'Unbezahlt',
  paid: 'Bezahlt',
  processing: 'In Bearbeitung',
  in_progress: 'In Bearbeitung',
  ready_to_ship: 'Versandbereit',
  shipped: 'Versendet',
  in_transit: 'Unterwegs',
  delivered: 'Geliefert',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
  canceled: 'Storniert',
  refunded: 'Erstattet',
  disputed: 'In Streitigkeit',
}

export function orderStatusLabel(status) {
  const key = String(status ?? '').trim().toLowerCase()
  return ORDER_STATUS_LABELS[key] ?? (key ? String(status) : 'Unbekannt')
}

export function normaliseOrder(order) {
  if (!order || typeof order !== 'object') return null
  const rawItems = Array.isArray(order.items) ? order.items : []
  const items = rawItems
    .map((entry) => ({
      ...(typeof entry === 'object' ? entry : {}),
      id: getId(entry),
      product: asProduct(entry?.product ?? entry?.productId ?? entry),
      quantity: Number(entry?.quantity ?? 1) || 1,
    }))
    .filter((entry) => entry.product)
  const product = asProduct(order.product ?? order.listing ?? items[0]?.product ?? order.productId)
  const total = Number(order.total ?? order.totalAmount ?? order.amount ?? order.grandTotal)
  return {
    ...order,
    id: getId(order),
    product,
    items: items.length ? items : product ? [{ product, quantity: Number(order.quantity ?? 1) || 1 }] : [],
    seller: order.seller ?? order.sellerId ?? null,
    buyer: order.buyer ?? order.buyerId ?? null,
    total: Number.isFinite(total) ? total : null,
    status: order.status ?? 'pending',
    createdAt: order.createdAt ?? order.created_at ?? null,
  }
}
