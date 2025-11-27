import React, { useState, useEffect } from 'react'
import './App.css'

interface Tab {
  id: number
  title: string
  url: string
  favIconUrl?: string
  active: boolean
  groupId?: number
  index: number
}

interface TabGroup {
  id: number
  title: string
  color: string
  collapsed: boolean
  tabs: Tab[]
}

const App: React.FC = () => {
  const [groupedTabs, setGroupedTabs] = useState<TabGroup[]>([])
  const [ungroupedTabs, setUngroupedTabs] = useState<Tab[]>([])
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<number, boolean>
  >({})
  const [hasClosedTabs, setHasClosedTabs] = useState<boolean>(false)

  // 检查是否有可恢复的标签页
  const checkClosedTabs = async () => {
    try {
      if (!chrome.sessions) {
        // 如果 sessions API 不可用，通过 background script 检查
        chrome.runtime.sendMessage({ action: 'checkClosedTabs' }, (response) => {
          if (response && response.hasClosedTabs !== undefined) {
            setHasClosedTabs(response.hasClosedTabs)
          }
        })
        return
      }

      const sessions = await chrome.sessions.getRecentlyClosed({
        maxResults: 1,
      })
      setHasClosedTabs(sessions.length > 0 && !!sessions[0].tab)
    } catch (error) {
      console.error('检查已关闭标签页失败:', error)
      setHasClosedTabs(false)
    }
  }

  useEffect(() => {
    loadTabs()
    checkClosedTabs()

    // 监听标签页更新
    const handleTabUpdated = () => loadTabs()
    const handleTabCreated = () => {
      loadTabs()
      checkClosedTabs()
    }
    const handleTabRemoved = () => {
      loadTabs()
      // 标签页关闭后检查是否有可恢复的标签页
      setTimeout(() => checkClosedTabs(), 100)
    }
    const handleTabActivated = () => loadTabs()
    const handleWindowFocusChanged = () => loadTabs()
    const handleTabGroupUpdated = () => loadTabs()
    const handleTabGroupMoved = () => loadTabs()

    chrome.tabs.onUpdated.addListener(handleTabUpdated)
    chrome.tabs.onCreated.addListener(handleTabCreated)
    chrome.tabs.onRemoved.addListener(handleTabRemoved)
    chrome.tabs.onActivated.addListener(handleTabActivated)
    chrome.windows.onFocusChanged.addListener(handleWindowFocusChanged)
    chrome.tabGroups.onUpdated.addListener(handleTabGroupUpdated)
    chrome.tabGroups.onMoved.addListener(handleTabGroupMoved)

    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabUpdated)
      chrome.tabs.onCreated.removeListener(handleTabCreated)
      chrome.tabs.onRemoved.removeListener(handleTabRemoved)
      chrome.tabs.onActivated.removeListener(handleTabActivated)
      chrome.windows.onFocusChanged.removeListener(handleWindowFocusChanged)
      chrome.tabGroups.onUpdated.removeListener(handleTabGroupUpdated)
      chrome.tabGroups.onMoved.removeListener(handleTabGroupMoved)
    }
  }, [])

  const loadTabs = async () => {
    try {
      const window = await chrome.windows.getCurrent()

      const tabsList = await chrome.tabs.query({ windowId: window.id })
      const formattedTabs: Tab[] = tabsList.map((tab) => ({
        id: tab.id!,
        title: tab.title || '无标题',
        url: tab.url || '',
        favIconUrl: tab.favIconUrl,
        active: tab.active || false,
        groupId: tab.groupId,
        index: tab.index ?? 0,
      }))

      // 分离分组和未分组的标签页
      const groupedTabMap = new Map<number, Tab[]>()
      const ungrouped: Tab[] = []

      formattedTabs.forEach((tab) => {
        if (tab.groupId && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
          if (!groupedTabMap.has(tab.groupId)) {
            groupedTabMap.set(tab.groupId, [])
          }
          groupedTabMap.get(tab.groupId)!.push(tab)
        } else {
          ungrouped.push(tab)
        }
      })

      // 获取所有分组信息
      const groupIds = Array.from(groupedTabMap.keys())
      const groupPromises = groupIds.map(async (groupId) => {
        try {
          const group = await chrome.tabGroups.get(groupId)
          const tabs = groupedTabMap.get(groupId) || []
          // 分组内的 tabs 按 index 排序
          tabs.sort((a, b) => a.index - b.index)
          return {
            id: group.id,
            title: group.title || '未命名组',
            color: String(group.color),
            collapsed: collapsedGroups[groupId] ?? true,
            tabs: tabs,
          } as TabGroup
        } catch (error) {
          console.error(`获取分组 ${groupId} 失败:`, error)
          return null
        }
      })

      const groups = await Promise.all(groupPromises)
      const validGroups = groups.filter((g): g is TabGroup => g !== null)

      // 按分组在窗口中的位置排序（使用第一个 tab 的 index）
      validGroups.sort((a, b) => {
        const aFirstTab = a.tabs[0]
        const bFirstTab = b.tabs[0]
        return (aFirstTab?.index ?? 0) - (bFirstTab?.index ?? 0)
      })

      // 未分组的 tabs 按 index 排序
      ungrouped.sort((a, b) => a.index - b.index)

      setGroupedTabs(validGroups)
      setUngroupedTabs(ungrouped)
    } catch (error) {
      console.error('加载tabs失败:', error)
    }
  }

  const toggleGroup = (groupId: number) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
    // 更新分组状态
    setGroupedTabs((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, collapsed: !group.collapsed } : group
      )
    )
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

  const getGroupColor = (color: string): string => {
    const colorMap: Record<string, string> = {
      grey: '#9aa0a6',
      blue: '#4285f4',
      red: '#ea4335',
      yellow: '#fbbc04',
      green: '#34a853',
      pink: '#f538a0',
      purple: '#a142f4',
      cyan: '#14b5e0',
      orange: '#ff9800',
    }
    return colorMap[color] || '#9aa0a6'
  }

  const reopenClosedTab = async () => {
    try {
      // 检查 sessions API 是否可用
      if (!chrome.sessions) {
        console.error('chrome.sessions API 不可用')
        return
      }

      // 获取最近关闭的标签页
      const sessions = await chrome.sessions.getRecentlyClosed({
        maxResults: 1,
      })

      if (sessions.length > 0 && sessions[0].tab) {
        // 恢复最近关闭的标签页
        await chrome.sessions.restore(sessions[0].tab.sessionId)
        loadTabs()
        setHasClosedTabs(false) // 恢复后隐藏按钮
        // 检查是否还有更多可恢复的标签页
        setTimeout(() => checkClosedTabs(), 100)
      } else {
        console.log('没有可恢复的标签页')
        setHasClosedTabs(false)
      }
    } catch (error) {
      console.error('恢复标签页失败:', error)
      // 如果直接调用失败，尝试通过 background script
      try {
        chrome.runtime.sendMessage({ action: 'reopenClosedTab' }, (response) => {
          if (response && response.success) {
            loadTabs()
            setHasClosedTabs(false)
            checkClosedTabs()
          }
        })
      } catch (e) {
        console.error('通过 background script 恢复也失败:', e)
      }
    }
  }

  const openBookmarks = () => {
    chrome.tabs.create({ url: 'chrome://bookmarks' })
  }

  return (
    <div className="app">
      <div className="tabs-container">
        {groupedTabs.length === 0 && ungroupedTabs.length === 0 ? (
          <div className="empty-state">暂无标签页</div>
        ) : (
          <>
            {/* 分组的标签页 */}
            {groupedTabs.map((group) => (
              <div key={group.id} className="tab-group">
                <div
                  className="tab-group-header"
                  onClick={() => toggleGroup(group.id)}
                  style={{ borderLeftColor: getGroupColor(group.color) }}
                >
                  <span className="group-toggle">
                    {group.collapsed ? '▶' : '▼'}
                  </span>
                  <span className="group-title">{group.title}</span>
                  <span className="group-count">({group.tabs.length})</span>
                </div>
                {!group.collapsed && (
                  <div className="tab-group-content">
                    {group.tabs.map((tab) => (
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
                          <div className="tab-url">
                            {tab.url ? new URL(tab.url).hostname : '新标签页'}
                          </div>
                        </div>
                        <button
                          className="tab-close"
                          onClick={(e) => closeTab(tab.id, e)}
                          title="关闭"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* 未分组的标签页 */}
            {ungroupedTabs.length > 0 && (
              <div className="ungrouped-tabs">
                {ungroupedTabs.map((tab) => (
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
                      <div className="tab-url">
                        {tab.url ? new URL(tab.url).hostname : '新标签页'}
                      </div>
                    </div>
                    <button
                      className="tab-close"
                      onClick={(e) => closeTab(tab.id, e)}
                      title="关闭"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <footer className="app-footer">
        <button
          className="bookmarks-btn"
          onClick={openBookmarks}
          title="书签"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
        <div className="footer-right">
          {hasClosedTabs && (
            <button
              className="reopen-btn"
              onClick={reopenClosedTab}
              title="重新打开已关闭的标签页"
            >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
          </button>
          )}
          <button
            className="settings-btn"
            onClick={() => chrome.runtime.openOptionsPage()}
            title="设置"
          >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="lucide lucide-settings-icon lucide-settings"
          >
            <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        </div>
      </footer>
    </div>
  )
}

export default App
