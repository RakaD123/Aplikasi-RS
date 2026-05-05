'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useThemeStore } from '@/lib/store/theme-store';
import { useAuthStore } from '@/lib/store/auth-store';
import Button from '@/components/ui/Button/Button';
import {
  Menu, X, Sun, Moon, Globe, ChevronDown,
  User, LogOut, LayoutDashboard, Heart
} from 'lucide-react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const pathname = usePathname();
  const { locale, setLocale, t } = useI18n();
  const { theme, toggleTheme } = useThemeStore();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/', label: t.nav.home },
    { href: '/doctors', label: t.nav.doctors },
    { href: '/articles', label: t.nav.articles },
    { href: '/promos', label: t.nav.promos },
  ];

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'doctor': return '/doctor/dashboard';
      case 'admin': return '/admin/dashboard';
      default: return '/patient/dashboard';
    }
  };

  return (
    <header className={cn(styles.navbar, isScrolled && styles.scrolled)}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <Heart className={styles.logoIcon} size={28} />
          <span className={styles.logoText}>
            RS <span className={styles.logoAccent}>Digital</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className={styles.desktopNav}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(styles.navLink, pathname === link.href && styles.active)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Theme Toggle */}
          <button className={styles.iconButton} onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Language Switcher */}
          <div className={styles.dropdown}>
            <button
              className={styles.iconButton}
              onClick={() => { setIsLangOpen(!isLangOpen); setIsUserOpen(false); }}
              aria-label="Change language"
            >
              <Globe size={20} />
            </button>
            {isLangOpen && (
              <div className={styles.dropdownMenu}>
                <button
                  className={cn(styles.dropdownItem, locale === 'id' && styles.activeItem)}
                  onClick={() => { setLocale('id'); setIsLangOpen(false); }}
                >
                  🇮🇩 Bahasa Indonesia
                </button>
                <button
                  className={cn(styles.dropdownItem, locale === 'en' && styles.activeItem)}
                  onClick={() => { setLocale('en'); setIsLangOpen(false); }}
                >
                  🇬🇧 English
                </button>
              </div>
            )}
          </div>

          {/* Auth Buttons / User Menu */}
          {isAuthenticated && user ? (
            <div className={styles.dropdown}>
              <button
                className={styles.userButton}
                onClick={() => { setIsUserOpen(!isUserOpen); setIsLangOpen(false); }}
              >
                <div className={styles.avatar}>
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <span className={styles.userName}>{user.full_name.split(' ')[0]}</span>
                <ChevronDown size={16} />
              </button>
              {isUserOpen && (
                <div className={styles.dropdownMenu}>
                  <Link href={getDashboardLink()} className={styles.dropdownItem} onClick={() => setIsUserOpen(false)}>
                    <LayoutDashboard size={16} /> {t.nav.dashboard}
                  </Link>
                  <Link href="/patient/profile" className={styles.dropdownItem} onClick={() => setIsUserOpen(false)}>
                    <User size={16} /> {t.nav.profile}
                  </Link>
                  <div className={styles.dropdownDivider} />
                  <button className={cn(styles.dropdownItem, styles.danger)} onClick={() => { logout(); setIsUserOpen(false); }}>
                    <LogOut size={16} /> {t.nav.logout}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.authButtons}>
              <Link href="/login">
                <Button variant="ghost" size="sm">{t.nav.login}</Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">{t.nav.register}</Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className={cn(styles.iconButton, styles.mobileToggle)}
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle menu"
          >
            {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className={cn(styles.mobileNav, isMobileOpen && styles.mobileOpen)}>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(styles.mobileLink, pathname === link.href && styles.active)}
          >
            {link.label}
          </Link>
        ))}
        {!isAuthenticated && (
          <div className={styles.mobileAuth}>
            <Link href="/login">
              <Button variant="outline" fullWidth>{t.nav.login}</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" fullWidth>{t.nav.register}</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
