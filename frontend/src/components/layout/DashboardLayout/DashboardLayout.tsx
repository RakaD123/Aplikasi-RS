'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import styles from './DashboardLayout.module.css';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/store/auth-store';
import { useThemeStore } from '@/lib/store/theme-store';
import { cn, getInitials } from '@/lib/utils';
import {
  LayoutDashboard, Calendar, Activity, Bell, CreditCard,
  MessageSquare, User, Settings, ChevronLeft, ChevronRight,
  Heart, Sun, Moon, Globe, LogOut, Menu, X, Users,
  Stethoscope, ClipboardList, FileText, BarChart3,
  PanelLeft
} from 'lucide-react';

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'patient' | 'doctor' | 'admin';
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    } else if (!isLoading && isAuthenticated && user?.role && user.role !== role) {
      if (user.role === 'doctor') router.replace('/doctor/dashboard');
      else if (user.role === 'admin') router.replace('/admin/dashboard');
      else router.replace('/patient/dashboard');
    }
  }, [isLoading, isAuthenticated, user, role, router]);

  if (isLoading || !isAuthenticated || (user?.role && user.role !== role)) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  const sidebarItems: Record<string, SidebarItem[]> = {
    patient: [
      { icon: <LayoutDashboard size={20} />, label: t.dashboard.overview, href: '/patient/dashboard' },
      { icon: <Calendar size={20} />, label: t.dashboard.myBookings, href: '/patient/booking' },
      { icon: <Activity size={20} />, label: t.dashboard.healthMonitor, href: '/patient/health-monitor' },
      { icon: <Bell size={20} />, label: t.dashboard.reminders, href: '/patient/reminders' },
      { icon: <CreditCard size={20} />, label: t.dashboard.transactions, href: '/patient/transactions' },
      { icon: <MessageSquare size={20} />, label: t.dashboard.consultations, href: '/patient/consultations' },
      { icon: <User size={20} />, label: t.dashboard.profile, href: '/patient/profile' },
    ],
    doctor: [
      { icon: <LayoutDashboard size={20} />, label: t.dashboard.overview, href: '/doctor/dashboard' },
      { icon: <ClipboardList size={20} />, label: t.dashboard.patientQueue, href: '/doctor/queue' },
      { icon: <Users size={20} />, label: t.dashboard.patientRecords, href: '/doctor/patients' },
      { icon: <MessageSquare size={20} />, label: t.dashboard.consultations, href: '/doctor/consultations' },
      { icon: <Calendar size={20} />, label: t.dashboard.mySchedule, href: '/doctor/schedule' },
    ],
    admin: [
      { icon: <LayoutDashboard size={20} />, label: t.dashboard.overview, href: '/admin/dashboard' },
      { icon: <Stethoscope size={20} />, label: t.dashboard.doctorManagement, href: '/admin/doctors' },
      { icon: <Users size={20} />, label: t.dashboard.userManagement, href: '/admin/users' },
      { icon: <FileText size={20} />, label: t.dashboard.contentManagement, href: '/admin/content' },
      { icon: <BarChart3 size={20} />, label: t.dashboard.transactionMonitor, href: '/admin/transactions' },
    ],
  };

  const items = sidebarItems[role] || [];
  const roleLabel = role === 'patient' ? 'Patient' : role === 'doctor' ? 'Doctor' : 'Admin';

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={cn(styles.sidebar, collapsed && styles.collapsed, mobileOpen && styles.mobileOpen)}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.logo}>
            <Heart size={24} className={styles.logoIcon} />
            {!collapsed && <span className={styles.logoText}>RS <span className={styles.logoAccent}>Digital</span></span>}
          </Link>
          <button className={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className={styles.nav}>
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(styles.navItem, pathname === item.href && styles.navActive)}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.navItem} onClick={toggleTheme} title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}>
            <span className={styles.navIcon}>{theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}</span>
            {!collapsed && <span className={styles.navLabel}>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>
          <button className={styles.navItem} onClick={() => setLocale(locale === 'id' ? 'en' : 'id')} title="Language">
            <span className={styles.navIcon}><Globe size={20} /></span>
            {!collapsed && <span className={styles.navLabel}>{locale === 'id' ? 'English' : 'Indonesia'}</span>}
          </button>
          <button className={cn(styles.navItem, styles.logoutBtn)} onClick={logout} title={t.nav.logout}>
            <span className={styles.navIcon}><LogOut size={20} /></span>
            {!collapsed && <span className={styles.navLabel}>{t.nav.logout}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && <div className={styles.overlay} onClick={() => setMobileOpen(false)} />}

      {/* Main Content */}
      <div className={cn(styles.main, collapsed && styles.mainExpanded)}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={styles.mobileMenuBtn} onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <button className={cn(styles.mobileMenuBtn, styles.desktopOnly)} onClick={() => setCollapsed(!collapsed)}>
              <PanelLeft size={20} />
            </button>
          </div>
          <div className={styles.topbarRight}>
            <div className={styles.roleBadge}>{roleLabel}</div>
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>
                {getInitials(user?.full_name || 'U')}
              </div>
              <div className={styles.userDetails}>
                <span className={styles.userName}>{user?.full_name || 'User'}</span>
                <span className={styles.userEmail}>{user?.email || ''}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
