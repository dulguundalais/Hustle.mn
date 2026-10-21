export type ChatMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
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
  ).sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function normalizedMessage(body: string): string | null {
  const value = body.trim();
  return value.length > 0 && value.length <= 4000 ? value : null;
}

export function appendUniqueMessage(messages: ChatMessage[], next: ChatMessage): ChatMessage[] {
  if (messages.some(message => message.id === next.id)) return messages;
  return [...messages, next].sort((a, b) => a.created_at.localeCompare(b.created_at));
}
