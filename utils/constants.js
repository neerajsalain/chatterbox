export const SOCKET_EVENTS = {
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  JOIN_CONVERSATION: 'join_conversation',
  SEND_MESSAGE: 'send_message',
  RECEIVE_MESSAGE: 'receive_message',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  USER_TYPING: 'user_typing',
  USER_STOP_TYPING: 'user_stop_typing',
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  MARK_READ: 'mark_read',
  MESSAGE_READ: 'message_read',
  DELETE_MESSAGE: 'delete_message',
  MESSAGE_DELETED: 'message_deleted',
}

export const MESSAGE_TYPES = { TEXT: 'text', IMAGE: 'image', FILE: 'file' }

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf']
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export const MESSAGES_PER_PAGE = 30
export const TYPING_DEBOUNCE_MS = 1500
