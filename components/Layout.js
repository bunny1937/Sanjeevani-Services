
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

const Layout = ({ children }) => {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Properties & Clients', href: '/properties-client', icon: '🏠' },
    { name: 'Services', href: '/services', icon: '🔧' },
    { name: 'Daily Book', href: '/daily-book', icon: '📖' },
    { name: 'Reminders', href: '/reminders', icon: '⏰' },
    { name: 'Expenses', href: '/expenses', icon: '💰' },
    { name: 'Labor', href: '/labor', icon: '👷' },
    { name: 'Reports', href: '/reports', icon: '📋' },
  ]

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">Sanjeevani Services</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="sidebar-close"
          >
            ✕
          </button>
        </div>
        <nav className="sidebar-nav">
          <div>
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <div className={`nav-item ${router.pathname === item.href ? 'active' : ''}`}>
                  <span className="nav-item-icon">{item.icon}</span>
                  {item.name}
                </div>
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className={`main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        {/* Top bar */}
        <div className="top-bar">
          <button
            onClick={() => setSidebarOpen(true)}
            className="menu-button"
          >
            ☰
          </button>
          <h2 className="page-title">Sanjeevani Services - Management Dashboard</h2>
        </div>

        {/* Page content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
