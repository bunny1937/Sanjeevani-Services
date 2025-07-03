
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
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 bg-orange-500 px-4">
          <h1 className="text-white text-lg font-semibold">Sanjeevani Services</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white"
          >
            ✕
          </button>
        </div>
        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <div className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
                  router.pathname === item.href
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </div>
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white shadow-sm px-4 py-2 flex items-center justify-between lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600"
          >
            ☰
          </button>
          <h2 className="text-xl font-semibold text-gray-900">Sanjeevani Services - Management Dashboard</h2>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
