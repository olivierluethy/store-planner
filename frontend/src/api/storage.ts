// Token persistence: Capacitor Preferences on native, localStorage on web.
import { Preferences } from '@capacitor/preferences'
import { Capacitor } from '@capacitor/core'

const TOKEN_KEY = 'sp_auth_token'

const isNative = Capacitor.isNativePlatform()

export async function getToken(): Promise<string | null> {
  if (isNative) {
    const { value } = await Preferences.get({ key: TOKEN_KEY })
    return value ?? null
  }
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export async function setToken(token: string): Promise<void> {
  if (isNative) {
    await Preferences.set({ key: TOKEN_KEY, value: token })
    return
  }
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

export async function clearToken(): Promise<void> {
  if (isNative) {
    await Preferences.remove({ key: TOKEN_KEY })
    return
  }
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}
