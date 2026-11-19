/** Translate transport/auth failures into short, user-facing German messages. */
export function apiErrorMessage(error, fallback = 'Die Anfrage konnte nicht abgeschlossen werden.') {
  if (error?.status === 401) return 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.'
  if (error?.status === 403) return 'Dafür hast du keine Berechtigung.'
  return error?.message || fallback
}
