import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
// 【新增】：导入图标资源 (electron-vite 的特有魔法后缀 ?asset)
import icon from '../../resources/icon.png?asset'

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true, // 隐藏顶部的菜单栏
    // 【新增】：挂载您的专属应用图标
    icon: icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false,
      // 【新增】：根据是否打包，智能禁用底层 DevTools 引擎
      devTools: !app.isPackaged 
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // 【新增】：拦截并封死浏览器的快捷键 (防止用户按 F12 强行召唤开发者工具)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (app.isPackaged) { // 只有在正式打包的版本里才拦截
      if (
        input.key === 'F12' || 
        (input.control && input.shift && input.key.toLowerCase() === 'i') || // Windows 快捷键
        (input.meta && input.alt && input.key.toLowerCase() === 'i')         // Mac 快捷键
      ) {
        event.preventDefault() // 拦截按键行为
      }
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    // 注释或删除这行代码：mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.easylabel.minio')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})