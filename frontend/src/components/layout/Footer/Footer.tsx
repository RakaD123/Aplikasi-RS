'use client';

import Link from 'next/link';
import styles from './Footer.module.css';
import { useI18n } from '@/lib/i18n';
import {
  Heart, MapPin, Phone, Mail,
  Globe, Share2, Link2, ExternalLink
} from 'lucide-react';

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className={styles.footer}>
      <div className={styles.wave}>
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path
            d="M0,40 C360,100 720,0 1080,60 C1260,80 1380,40 1440,40 L1440,100 L0,100 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <div className={styles.content}>
        <div className={styles.container}>
          <div className={styles.grid}>
            {/* Brand */}
            <div className={styles.brand}>
              <div className={styles.logo}>
                <Heart className={styles.logoIcon} size={24} />
                <span className={styles.logoText}>
                  RS <span className={styles.logoAccent}>Digital</span>
                </span>
              </div>
              <p className={styles.description}>{t.footer.description}</p>
              <div className={styles.socials}>
                <a href="#" className={styles.socialLink} aria-label="Website"><Globe size={20} /></a>
                <a href="#" className={styles.socialLink} aria-label="Share"><Share2 size={20} /></a>
                <a href="#" className={styles.socialLink} aria-label="Link"><Link2 size={20} /></a>
                <a href="#" className={styles.socialLink} aria-label="External"><ExternalLink size={20} /></a>
              </div>
            </div>

            {/* Quick Links */}
            <div className={styles.column}>
              <h4 className={styles.columnTitle}>{t.footer.quickLinks}</h4>
              <Link href="/" className={styles.footerLink}>{t.nav.home}</Link>
              <Link href="/doctors" className={styles.footerLink}>{t.nav.doctors}</Link>
              <Link href="/articles" className={styles.footerLink}>{t.nav.articles}</Link>
              <Link href="/promos" className={styles.footerLink}>{t.nav.promos}</Link>
            </div>

            {/* Services */}
            <div className={styles.column}>
              <h4 className={styles.columnTitle}>{t.footer.services}</h4>
              <Link href="/doctors" className={styles.footerLink}>{t.features.onlineBooking}</Link>
              <Link href="#" className={styles.footerLink}>{t.features.telemedicine}</Link>
              <Link href="#" className={styles.footerLink}>{t.features.healthMonitor}</Link>
              <Link href="#" className={styles.footerLink}>{t.features.digitalPayment}</Link>
            </div>

            {/* Contact */}
            <div className={styles.column}>
              <h4 className={styles.columnTitle}>{t.footer.contact}</h4>
              <div className={styles.contactItem}>
                <MapPin size={16} />
                <span>{t.footer.address}</span>
              </div>
              <div className={styles.contactItem}>
                <Phone size={16} />
                <span>{t.footer.phone}</span>
              </div>
              <div className={styles.contactItem}>
                <Mail size={16} />
                <span>{t.footer.email}</span>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className={styles.bottom}>
            <p className={styles.copyright}>{t.footer.copyright}</p>
            <div className={styles.bottomLinks}>
              <Link href="#" className={styles.bottomLink}>{t.footer.privacy}</Link>
              <Link href="#" className={styles.bottomLink}>{t.footer.terms}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
