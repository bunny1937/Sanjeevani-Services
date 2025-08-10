"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "./Layout.module.css";

const Layout = ({ children, user }) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [recentReminders, setRecentReminders] = useState([]);
  const [reminderStats, setReminderStats] = useState({
    totalReminders: 0,
    overdue: 0,
    dueToday: 0,
    upcoming: 0,
    scheduled: 0,
    completed: 0,
    critical: 0,
    on_hold: 0,
  });

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
    {
      name: "Invoices",
      href: "/invoices",
      icon: "💼",
      color: "orange",
    },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/reminders");
        if (response.ok) {
          const data = await response.json();
          if (data.stats) {
            setReminderStats(data.stats);
          }

          // Get recent reminders for notification popup
          const recent = [
            ...(data.overdueReminders || []).slice(0, 3),
            ...(data.reminders || []).slice(0, 3),
            ...(data.scheduledReminders || []).slice(0, 2),
          ].slice(0, 5);
          setRecentReminders(recent);
        }
      } catch (error) {
        console.error("Error fetching reminder stats:", error);
      }
    };
    fetchStats();
    // Optionally, refetch stats periodically
    const interval = setInterval(fetchStats, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);
  const handleNavItemClick = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className={styles.sidebarOverlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className={styles.layoutContainer}>
        {/* Sidebar */}
        <div className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
          <div className={styles.sidebarHeader}>
            <div className={styles.logo}>
              <Image
                src="/logo.jpg"
                alt="Sanjeevani Logo"
                width={50} // adjust size
                height={50}
                className="styles.logoIcon"
              />
            </div>
            <div className={styles.logoText}>
              <h1>Sanjeevani</h1>
              <p>Services</p>
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
                    } ${styles[item.color] || ""}`}
                    onClick={handleNavItemClick}
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
                    onClick={handleNavItemClick}
                  >
                    <div className={styles.navItemIcon}>
                      <span>{item.icon}</span>
                    </div>
                    <span className={styles.navItemText}>{item.name}</span>
                    {item.name === "Reminders" && (
                      <div className={styles.reminderCounts}>
                        {reminderStats.overdue > 0 && (
                          <span
                            className={`${styles.countBadge} ${styles.overdueBadge}`}
                            title="Overdue Reminders"
                          >
                            {reminderStats.overdue}
                          </span>
                        )}
                        {reminderStats.dueToday > 0 && (
                          <span
                            className={`${styles.countBadge} ${styles.dueTodayBadge}`}
                            title="Due Today"
                          >
                            {reminderStats.dueToday}
                          </span>
                        )}
                        {reminderStats.critical > 0 && (
                          <span
                            className={`${styles.countBadge} ${styles.criticalBadge}`}
                            title="Critical Reminders"
                          >
                            {reminderStats.critical}
                          </span>
                        )}
                      </div>
                    )}
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
            {/* Left */}
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

            {/* Right */}
            <div className={styles.topBarRight}>
              {/* Notifications */}
              <div className={styles.notificationWrapper}>
                <button
                  className={styles.notificationButton}
                  onClick={() => setNotificationOpen(!notificationOpen)}
                >
                  🔔
                  <div className={styles.notificationBadge}>
                    {reminderStats.overdue +
                      reminderStats.dueToday +
                      reminderStats.critical}
                  </div>
                </button>

                {notificationOpen && (
                  <div className={styles.notificationPopup}>
                    <div className={styles.notificationHeader}>
                      <h3>Recent Reminders</h3>
                      <button
                        onClick={() => setNotificationOpen(false)}
                        className={styles.closeButton}
                      >
                        ✕
                      </button>
                    </div>

                    <div className={styles.notificationStats}>
                      <div className={styles.statItem}>
                        <span>Overdue:</span>
                        <span className={styles.overdue}>
                          {reminderStats.overdue}
                        </span>
                      </div>
                      <div className={styles.statItem}>
                        <span>Due Today:</span>
                        <span className={styles.dueToday}>
                          {reminderStats.dueToday}
                        </span>
                      </div>
                      <div className={styles.statItem}>
                        <span>Scheduled:</span>
                        <span className={styles.scheduled}>
                          {reminderStats.scheduled}
                        </span>
                      </div>
                    </div>

                    <div className={styles.notificationList}>
                      {recentReminders.length > 0 ? (
                        recentReminders.map((reminder, i) => (
                          <div key={i} className={styles.notificationItem}>
                            <div>
                              <strong>{reminder.propertyName}</strong>
                              <small>{reminder.serviceType}</small>
                              <small>
                                {reminder.scheduledDate
                                  ? new Date(
                                      reminder.scheduledDate
                                    ).toLocaleDateString("en-GB")
                                  : "No date set"}
                              </small>
                            </div>
                            <span className={styles[reminder.status]}>
                              {reminder.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className={styles.noReminders}>
                          No recent reminders
                        </div>
                      )}
                    </div>

                    <div className={styles.notificationFooter}>
                      <Link href="/reminders">
                        <button className={styles.viewAllButton}>
                          View All
                        </button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Section */}
              <div className={styles.profileBox}>
                {router.pathname === "/auth/signin" ? (
                  <span className={styles.welcomeText}>Sign in</span>
                ) : (
                  <>
                    <div className={styles.avatar}>👤</div>
                    <span className={styles.welcomeText}>
                      Welcome, {session?.user?.name || "User"}
                    </span>
                    <button
                      className={styles.logoutButton}
                      onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className={styles.pageContent}>{children}</main>
        </div>
      </div>
    </>
  );
};

export default Layout;
