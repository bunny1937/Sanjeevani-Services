"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "./Layout.module.css";

const Layout = ({ children }) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/", icon: "📊", color: "blue" },
    {
      name: "Properties & Clients",
      href: "/properties-client",
      icon: "🏠",
      color: "green",
    },
    { name: "Services", href: "/services", icon: "🔧", color: "purple" },
    { name: "Daily Book", href: "/daily-book", icon: "📖", color: "orange" },
    { name: "Reminders", href: "/reminders", icon: "⏰", color: "red" },
    { name: "Expenses", href: "/expenses", icon: "💰", color: "yellow" },
    { name: "Labor", href: "/labor", icon: "👷", color: "indigo" },
    { name: "Reports", href: "/reports", icon: "📋", color: "pink" },
  ];

  return (
    <div className={styles.layoutContainer}>
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className={styles.sidebarOverlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>🏥</div>
            <div className={styles.logoText}>
              <h1>Sanjeevani</h1>
              <p>Services</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className={styles.sidebarClose}
          >
            ✕
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          <div className={styles.navSection}>
            <p className={styles.navSectionTitle}>Main Menu</p>
            {navigation.slice(0, 4).map((item) => (
              <Link key={item.name} href={item.href}>
                <div
                  className={`${styles.navItem} ${
                    router.pathname === item.href ? styles.active : ""
                  } ${styles[item.color]}`}
                >
                  <div className={styles.navItemIcon}>
                    <span>{item.icon}</span>
                  </div>
                  <span className={styles.navItemText}>{item.name}</span>
                  {router.pathname === item.href && (
                    <div className={styles.activeIndicator} />
                  )}
                </div>
              </Link>
            ))}
          </div>

          <div className={styles.navSection}>
            <p className={styles.navSectionTitle}>Management</p>
            {navigation.slice(4).map((item) => (
              <Link key={item.name} href={item.href}>
                <div
                  className={`${styles.navItem} ${
                    router.pathname === item.href ? styles.active : ""
                  } ${styles[item.color]}`}
                >
                  <div className={styles.navItemIcon}>
                    <span>{item.icon}</span>
                  </div>
                  <span className={styles.navItemText}>{item.name}</span>
                  {router.pathname === item.href && (
                    <div className={styles.activeIndicator} />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div
        className={`${styles.mainContent} ${
          sidebarOpen ? styles.sidebarOpen : ""
        }`}
      >
        {/* Top bar */}
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button
              onClick={() => setSidebarOpen(true)}
              className={styles.menuButton}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            <div className={styles.breadcrumb}>
              <span>Sanjeevani Services</span>
              <span className={styles.breadcrumbSeparator}>›</span>
              <span>Management Dashboard</span>
            </div>
          </div>

          <div className={styles.topBarRight}>
            <button className={styles.notificationButton}>
              <span>🔔</span>
              <div className={styles.notificationBadge}>3</div>
            </button>
            <button className={styles.profileButton}>
              <div className={styles.userProfile}>
                <div className={styles.userAvatar}>👤</div>
                <div className={styles.userInfo}>
                  <p className={styles.userName}>Admin </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className={styles.pageContent}>{children}</main>
      </div>
    </div>
  );
};

export default Layout;
