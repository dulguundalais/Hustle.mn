export type ChatMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  read_at?: string | null;
};

export function conversationPeer(message: ChatMessage, currentUserId: string): string | null {
  if (message.sender_id === currentUserId && message.recipient_id !== currentUserId) return message.recipient_id;
  if (message.recipient_id === currentUserId && message.sender_id !== currentUserId) return message.sender_id;
  return null;
}

export function threadMessages(messages: ChatMessage[], currentUserId: string, peerId: string): ChatMessage[] {
  if (!peerId || peerId === currentUserId) return [];
  return messages.filter(message =>
    (message.sender_id === currentUserId && message.recipient_id === peerId) ||
    (message.sender_id === peerId && message.recipient_id === currentUserId)
  ).sort(compareMessages);
}

export function normalizedMessage(body: string): string | null {
  const value = body.trim();
  return value.length > 0 && value.length <= 4000 ? value : null;
}

// Keep ordering stable even when multiple messages have identical timestamps.
export function compareMessages(a: ChatMessage, b: ChatMessage): number {
  return a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id);
}

// A realtime event or a later DB refresh may include a newly populated read_at.
// Keep it without overwriting an existing value with an older null projection.
export function mergeMessagePage(messages: ChatMessage[], page: ChatMessage[]): ChatMessage[] {
  const byId = new Map(messages.map(message => [message.id, message]));
  for (const message of page) {
    const current = byId.get(message.id);
    byId.set(message.id, current
      ? {...current, ...message,
        read_at: message.read_at ?? current.read_at}
      : message);
  }
  return [...byId.values()].sort(compareMessages);
}

export function appendUniqueMessage(messages: ChatMessage[], next: ChatMessage): ChatMessage[] {
  return mergeMessagePage(messages, [next]);
}
