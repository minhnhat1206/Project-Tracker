export const KNOWN_USERS = [
  { email: 'minhnhatnhc@gmail.com', name: 'Nhật', role: 'owner' },
  { email: 'truong.nhat3040@gmail.com', name: 'Trường', role: 'member' },
  { email: 'anhhieund2002@gmail.com', name: 'Hiếu', role: 'member' },
]

export function getUserName(email) {
  if (!email) return ''
  const user = KNOWN_USERS.find(u => u.email === email)
  return user ? user.name : email.split('@')[0]
}

export function getUserByEmail(email) {
  return KNOWN_USERS.find(u => u.email === email) || null
}
