// Background service worker
console.log('StayLane background service worker loaded')

// 配置sidePanel行为：点击action图标时打开sidePanel
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('设置sidePanel行为失败:', error))

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
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
