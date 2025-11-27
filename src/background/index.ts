// Background service worker
console.log('StayLane background service worker loaded')

// 配置sidePanel行为：点击action图标时打开sidePanel
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('设置sidePanel行为失败:', error))

// 监听标签页更新
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url)
  }
})

// 监听窗口焦点变化
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    console.log('Window focused:', windowId)
  }
})

// 监听标签页创建
chrome.tabs.onCreated.addListener((tab) => {
  console.log('Tab created:', tab.id)
})

// 监听标签页移除
chrome.tabs.onRemoved.addListener((tabId) => {
  console.log('Tab removed:', tabId)
})

// 监听快捷键命令
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-side-panel') {
    // 必须在用户手势的响应中立即调用，不能等待异步操作
    // 先获取当前标签页，然后立即打开 sidePanel
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
          // 使用 tabId 打开 sidePanel
          chrome.sidePanel
            .open({ tabId: tabs[0].id })
            .catch((error) => {
              console.error('打开 sidePanel 失败:', error)
            })
        } else {
          // 如果无法获取标签页，尝试使用窗口ID
          chrome.windows.getCurrent((window) => {
            if (window && window.id) {
              chrome.sidePanel
                .open({ windowId: window.id })
                .catch((error) => {
                  console.error('打开 sidePanel 失败:', error)
                })
            }
          })
        }
      }
    )
  }
})
