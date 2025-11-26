import React, { useState, useEffect } from 'react'
import './App.css'

const OptionsApp: React.FC = () => {
  const [settings, setSettings] = useState({
    verticalTabsEnabled: true,
    windowManagementEnabled: true,
    theme: 'light',
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.sync.get(['settings'])
      if (result.settings) {
        setSettings({ ...settings, ...result.settings })
      }
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  }

  const saveSettings = async (newSettings: typeof settings) => {
    try {
      await chrome.storage.sync.set({ settings: newSettings })
      setSettings(newSettings)
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }

  const handleToggle = (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] }
    saveSettings(newSettings)
  }

  const handleThemeChange = (theme: string) => {
    const newSettings = { ...settings, theme }
    saveSettings(newSettings)
  }

  return (
    <div className="options-app">
      <header className="options-header">
        <h1>StayLane 设置</h1>
      </header>

      <div className="options-content">
        <section className="options-section">
          <h2>功能设置</h2>

          <div className="option-item">
            <div className="option-info">
              <h3>垂直标签页</h3>
              <p>启用垂直标签页显示模式</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.verticalTabsEnabled}
                onChange={() => handleToggle('verticalTabsEnabled')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="option-item">
            <div className="option-info">
              <h3>窗口管理</h3>
              <p>启用窗口管理功能</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.windowManagementEnabled}
                onChange={() => handleToggle('windowManagementEnabled')}
              />
              <span className="slider"></span>
            </label>
          </div>
        </section>

        <section className="options-section">
          <h2>外观设置</h2>

          <div className="option-item">
            <div className="option-info">
              <h3>主题</h3>
              <p>选择界面主题</p>
            </div>
            <div className="theme-selector">
              <button
                className={`theme-btn ${
                  settings.theme === 'light' ? 'active' : ''
                }`}
                onClick={() => handleThemeChange('light')}
              >
                浅色
              </button>
              <button
                className={`theme-btn ${
                  settings.theme === 'dark' ? 'active' : ''
                }`}
                onClick={() => handleThemeChange('dark')}
              >
                深色
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default OptionsApp
