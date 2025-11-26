import React, { useState, useEffect } from 'react'
import './App.css'

interface Tab {
  id: number
  title: string
  url: string
  favIconUrl?: string
  active: boolean
}

const App: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [currentWindowId, setCurrentWindowId] = useState<number | undefined>()

  useEffect(() => {
    loadTabs()
  }, [])

  const loadTabs = async () => {
    try {
      const window = await chrome.windows.getCurrent()
      setCurrentWindowId(window.id)

      const tabsList = await chrome.tabs.query({ windowId: window.id })
      const formattedTabs: Tab[] = tabsList.map((tab) => ({
        id: tab.id!,
        title: tab.title || '无标题',
        url: tab.url || '',
        favIconUrl: tab.favIconUrl,
        active: tab.active || false,
      }))

      setTabs(formattedTabs)
    } catch (error) {
      console.error('加载tabs失败:', error)
    }
  }

  const switchTab = async (tabId: number) => {
    try {
      await chrome.tabs.update(tabId, { active: true })
      loadTabs()
    } catch (error) {
      console.error('切换tab失败:', error)
    }
  }

  const closeTab = async (tabId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await chrome.tabs.remove(tabId)
      loadTabs()
    } catch (error) {
      console.error('关闭tab失败:', error)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>StayLane</h1>
        <button
          className="settings-btn"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          ⚙️
        </button>
      </header>

      <div className="tabs-container">
        {tabs.length === 0 ? (
          <div className="empty-state">暂无标签页</div>
        ) : (
          tabs.map((tab) => (
            <div
              key={tab.id}
              className={`tab-item ${tab.active ? 'active' : ''}`}
              onClick={() => switchTab(tab.id)}
            >
              <div className="tab-icon">
                {tab.favIconUrl ? (
                  <img src={tab.favIconUrl} alt="" />
                ) : (
                  <span>📄</span>
                )}
              </div>
              <div className="tab-content">
                <div className="tab-title">{tab.title}</div>
                <div className="tab-url">{new URL(tab.url).hostname}</div>
              </div>
              <button
                className="tab-close"
                onClick={(e) => closeTab(tab.id, e)}
                title="关闭"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default App
