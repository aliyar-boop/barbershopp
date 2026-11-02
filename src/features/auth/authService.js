const USERS_KEY = 'golden-cut-demo-users-v1'
const SESSION_KEY = 'golden-cut-demo-session-v1'
const AUTH_EVENT = 'golden-cut-demo-auth-change'

function getUsers() {
  const saved = window.localStorage.getItem(USERS_KEY)
  if (saved) {
    const users = JSON.parse(saved)
    if (!Array.isArray(users)) throw new Error('Демо аккаунттардын маалыматы туура эмес.')
    return users
  }
  const users = [
    { uid: 'demo-customer', name: 'Demo Customer', phone: '+996 700 000 001', email: 'customer@goldencut.demo', password: 'demo123456', role: 'user' },
    { uid: 'demo-barber', name: 'Адилет Осмонов', phone: '+996 700 000 002', email: 'barber@goldencut.demo', password: 'demo123456', role: 'barber' },
  ]
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
  return users
}

function createSession(account) {
  const user = { uid: account.uid, email: account.email, displayName: account.name, role: account.role }
  const profile = {
    uid: account.uid,
    name: account.name,
    phone: account.phone,
    email: account.email,
    role: account.role,
    createdAt: new Date().toISOString(),
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ user, profile }))
  window.dispatchEvent(new Event(AUTH_EVENT))
  return user
}

export function readDemoSession() {
  const saved = window.localStorage.getItem(SESSION_KEY)
  if (!saved) return { user: null, profile: null }
  try {
    return JSON.parse(saved)
  } catch {
    window.localStorage.removeItem(SESSION_KEY)
    return { user: null, profile: null }
  }
}

export function subscribeDemoAuth(callback) {
  window.addEventListener(AUTH_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(AUTH_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

export async function register({ name, phone, email, password, role = 'user' }) {
  const normalizedEmail = email.trim().toLowerCase()
  if (!['user', 'barber'].includes(role)) throw new Error('Аккаунт түрү туура эмес.')
  const users = getUsers()
  if (users.some((account) => account.email.toLowerCase() === normalizedEmail)) {
    throw new Error('Бул email менен аккаунт мурунтан бар.')
  }
  const account = {
    uid: crypto.randomUUID(),
    name: name.trim(),
    phone: phone.trim(),
    email: normalizedEmail,
    password,
    role,
  }
  users.push(account)
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
  return createSession(account)
}

export async function login(email, password) {
  const account = getUsers().find((item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password)
  if (!account) throw new Error('Email же сырсөз туура эмес.')
  return createSession(account)
}

export async function logout() {
  window.localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event(AUTH_EVENT))
}
