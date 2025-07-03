
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from './Layout.module.css'

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
    <div className={styles.layoutContainer}>
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.sidebarTitle}>Sanjeevani Services</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className={styles.sidebarClose}
          >
            ✕
          </button>
        </div>
        <nav className={styles.sidebarNav}>
          <div>
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <div className={`${styles.navItem} ${router.pathname === item.href ? styles.active : ''}`}>
                  <span className={styles.navItemIcon}>{item.icon}</span>
                  {item.name}
                </div>
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className={`${styles.mainContent} ${!sidebarOpen ? styles.sidebarClosed : ''}`}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <button
            onClick={() => setSidebarOpen(true)}
            className={styles.menuButton}
          >
            ☰
          </button>
          <h2 className={styles.pageTitle}>Sanjeevani Services - Management Dashboard</h2>
        </div>

        {/* Page content */}
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
