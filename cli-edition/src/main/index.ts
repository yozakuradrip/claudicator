import { app, Menu, powerMonitor, nativeTheme } from 'electron'
import { initialize as initAuth } from './auth/AuthManager'
import { startPolling, onUpdate, refresh } from './usage/UsageService'
import { initTray, updateTrayIcon, sendToPopup, openSettings } from './tray/TrayController'
import { getSettings } from '@shared/main/settings/SettingsStore'
import { applyAutoLaunch } from '@shared/main/startup/AutoLaunch'
import { registerIpcHandlers } from './ipc/handlers'

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null)
  app.setAppUserModelId('com.yozak.claudicator')

  registerIpcHandlers()

  const settings = getSettings()
  applyAutoLaunch(settings.autoStart)
  // ダーク時に Windows の OS タイトルバーも黒くする（BiRec と同じ挙動）
  nativeTheme.themeSource = settings.theme ?? 'dark'

  initTray()

  if (process.env['CLAUDICATOR_AUTO_VERIFY']) {
    setTimeout(() => openSettings(), 2000)
  }

  await initAuth()
  startPolling()
  powerMonitor.on('resume', () => refresh())

  onUpdate((state) => {
    updateTrayIcon(state)
    sendToPopup(state)
  })
})

app.on('window-all-closed', () => {
  // Tray app: keep running
})
