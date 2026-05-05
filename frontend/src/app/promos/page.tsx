'use client';

import styles from './promos.module.css';
import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';
import Button from '@/components/ui/Button/Button';
import Badge from '@/components/ui/Badge/Badge';
import { useI18n } from '@/lib/i18n';
import { mockPromos } from '@/lib/data/mock-data';
import { getDaysLeft, formatDate } from '@/lib/utils';
import { Sparkles, Calendar } from 'lucide-react';

export default function PromosPage() {
  const { t } = useI18n();

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <section className={styles.header}>
          <div className={styles.container}>
            <h1 className={styles.title}>{t.promos.title}</h1>
            <p className={styles.subtitle}>{t.promos.subtitle}</p>
          </div>
        </section>

        <section className={styles.content}>
          <div className={styles.container}>
            <div className={styles.grid}>
              {mockPromos.map((promo) => {
                const daysLeft = getDaysLeft(promo.valid_until);
                return (
                  <div key={promo.id} className={styles.card}>
                    <div className={styles.cardImage}>
                      <div className={styles.imagePlaceholder}>
                        <Sparkles size={36} />
                        <span className={styles.discount}>{promo.discount_percentage}% OFF</span>
                      </div>
                      <Badge variant={daysLeft <= 7 ? 'danger' : 'success'} size="sm" className={styles.daysBadge}>
                        {daysLeft} {t.promos.daysLeft}
                      </Badge>
                    </div>
                    <div className={styles.cardBody}>
                      <h3 className={styles.cardTitle}>{promo.title}</h3>
                      <p className={styles.cardDesc}>{promo.description}</p>
                      <div className={styles.validity}>
                        <Calendar size={14} />
                        <span>{t.promos.validUntil} {formatDate(promo.valid_until)}</span>
                      </div>
                      {promo.code && (
                        <div className={styles.code}>{promo.code}</div>
                      )}
                      <Button variant="accent" fullWidth>{t.promos.claimNow}</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
