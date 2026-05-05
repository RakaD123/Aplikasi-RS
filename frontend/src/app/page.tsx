'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';
import Button from '@/components/ui/Button/Button';
import Badge from '@/components/ui/Badge/Badge';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/store/auth-store';
import { mockDoctors, mockArticles, mockPromos } from '@/lib/data/mock-data';
import { formatDate, getDaysLeft, getInitials } from '@/lib/utils';
import useSWR from 'swr';
import { api } from '@/lib/api';
import {
  Search, CalendarCheck, Video, Activity, CreditCard,
  Bell, FileText, Star, Clock, ArrowRight, Users,
  Stethoscope, Award, ChevronRight, Sparkles
} from 'lucide-react';

function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, end, duration]);

  return { count, ref };
}

export default function HomePage() {
  const { t } = useI18n();
  const { user, token } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const isLoggedIn = !!token;

  const fetcher = (url: string) => api.get(url).then((res) => res.data);

  // Fetch real data when user is logged in
  const { data: bookingsData } = useSWR(isLoggedIn ? '/patient/bookings' : null, fetcher, { refreshInterval: 5000 });
  const { data: healthLogsData } = useSWR(isLoggedIn ? '/patient/health-logs' : null, fetcher, { refreshInterval: 5000 });

  const bookings = bookingsData?.data || [];
  const healthLogs = healthLogsData?.logs || [];

  // Next upcoming appointment
  const upcomingAppointment = bookings
    .filter((b: any) => new Date(b.appointment_time) > new Date() && b.booking_status !== 'cancelled' && b.booking_status !== 'completed')
    .sort((a: any, b: any) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime())[0];

  const nextApptLabel = upcomingAppointment
    ? new Date(upcomingAppointment.appointment_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + new Date(upcomingAppointment.appointment_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : 'No upcoming';

  // Health Score calculation (reused from patient dashboard)
  const calculateHealthScore = (logs: any[]) => {
    if (!logs || logs.length === 0) return '-';
    let score = 100;
    const latestLogs: Record<string, any> = {};
    logs.forEach(l => {
      if (!latestLogs[l.metric_type] || new Date(l.recorded_at) > new Date(latestLogs[l.metric_type].recorded_at)) {
        latestLogs[l.metric_type] = l;
      }
    });
    if (latestLogs.bloodPressure) {
      const parts = latestLogs.bloodPressure.value.split('/');
      if (parts.length === 2) {
        const sys = parseInt(parts[0]);
        if (sys > 140) score -= 15; else if (sys > 120) score -= 5; else if (sys < 90) score -= 10;
      }
    }
    if (latestLogs.bloodSugar) {
      const val = parseFloat(latestLogs.bloodSugar.value);
      if (val > 200) score -= 15; else if (val > 140) score -= 10; else if (val < 70) score -= 10;
    }
    if (latestLogs.heartRate) {
      const val = parseFloat(latestLogs.heartRate.value);
      if (val > 100) score -= 10; else if (val < 60) score -= 5;
    }
    if (latestLogs.cholesterol) {
      const val = parseFloat(latestLogs.cholesterol.value);
      if (val > 240) score -= 15; else if (val > 200) score -= 5;
    }
    return Math.max(0, Math.min(100, score)).toString();
  };

  const healthScore = isLoggedIn ? calculateHealthScore(healthLogs) : '92';

  const stat1 = useCountUp(150);
  const stat2 = useCountUp(25000);
  const stat3 = useCountUp(50000);
  const stat4 = useCountUp(98);

  const features = [
    { icon: <CalendarCheck size={28} />, title: t.features.onlineBooking, desc: t.features.onlineBookingDesc, color: '#3b5cf8' },
    { icon: <Video size={28} />, title: t.features.telemedicine, desc: t.features.telemedicineDesc, color: '#07c4af' },
    { icon: <Activity size={28} />, title: t.features.healthMonitor, desc: t.features.healthMonitorDesc, color: '#f59e0b' },
    { icon: <CreditCard size={28} />, title: t.features.digitalPayment, desc: t.features.digitalPaymentDesc, color: '#8b5cf6' },
    { icon: <Bell size={28} />, title: t.features.healthReminder, desc: t.features.healthReminderDesc, color: '#ef4444' },
    { icon: <FileText size={28} />, title: t.features.medicalRecord, desc: t.features.medicalRecordDesc, color: '#06b6d4' },
  ];

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.heroOrb1} />
          <div className={styles.heroOrb2} />
          <div className={styles.heroOrb3} />
          <div className={styles.heroGrid} />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.heroTextWrapper}>
            <Badge variant="accent" size="md">
              <Sparkles size={14} style={{ marginRight: 6 }} />
              #1 Digital Hospital Platform
            </Badge>
            <h1 className={styles.heroTitle}>{t.hero.title}</h1>
            <p className={styles.heroSubtitle}>{t.hero.subtitle}</p>

            {/* Search Bar */}
            <div className={styles.searchBar}>
              <Search size={20} className={styles.searchIcon} />
              <input
                type="text"
                placeholder={t.hero.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              <Link href={`/doctors?q=${searchQuery}`}>
                <Button variant="primary" size="md">
                  {t.hero.searchButton}
                </Button>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className={styles.heroTrust}>
              <div className={styles.trustItem}>
                <div className={styles.trustAvatars}>
                  {['S', 'B', 'C', 'D'].map((letter, i) => (
                    <div key={i} className={styles.trustAvatar} style={{ zIndex: 4 - i }}>
                      {letter}
                    </div>
                  ))}
                </div>
                <span className={styles.trustText}>
                  <strong>25,000+</strong> pasien terdaftar
                </span>
              </div>
              <div className={styles.trustDivider} />
              <div className={styles.trustRating}>
                <Star size={18} fill="#f59e0b" color="#f59e0b" />
                <span><strong>4.9</strong>/5 rating</span>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className={styles.heroVisual}>
            <div className={styles.heroCard}>
              <div className={styles.heroCardHeader}>
                <div className={styles.heroCardDot} style={{ background: '#ef4444' }} />
                <div className={styles.heroCardDot} style={{ background: '#f59e0b' }} />
                <div className={styles.heroCardDot} style={{ background: '#22c55e' }} />
              </div>
              <div className={styles.heroCardContent}>
                <div className={styles.heroDoctor}>
                  <div className={styles.heroDoctorAvatar}>
                    {getInitials(mockDoctors[0].name)}
                  </div>
                  <div>
                    <p className={styles.heroDoctorName}>{mockDoctors[0].name}</p>
                    <p className={styles.heroDoctorSpec}>{mockDoctors[0].specialization}</p>
                  </div>
                </div>
                <div className={styles.heroSlots}>
                  <p className={styles.heroSlotLabel}>Available Slots</p>
                  <div className={styles.heroSlotGrid}>
                    {['08:00', '08:30', '09:30', '10:00'].map((time) => (
                      <div key={time} className={styles.heroSlot}>{time}</div>
                    ))}
                  </div>
                </div>
                <Button variant="accent" fullWidth size="sm">
                  {t.sections.bookNow} <ArrowRight size={16} />
                </Button>
              </div>
            </div>

            {/* Floating Elements */}
            <div className={styles.floatingCard1}>
              <Activity size={20} color="#07c4af" />
              <div>
                <span className={styles.floatingLabel}>Health Score</span>
                <span className={styles.floatingValue}>{healthScore}/100</span>
              </div>
            </div>
            <div className={styles.floatingCard2}>
              <CalendarCheck size={20} color="#3b5cf8" />
              <div>
                <span className={styles.floatingLabel}>Next Appointment</span>
                <span className={styles.floatingValue}>{nextApptLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            <div className={styles.statItem} ref={stat1.ref}>
              <Stethoscope size={32} className={styles.statIcon} />
              <span className={styles.statNumber}>{stat1.count}+</span>
              <span className={styles.statLabel}>{t.stats.doctors}</span>
            </div>
            <div className={styles.statItem} ref={stat2.ref}>
              <Users size={32} className={styles.statIcon} />
              <span className={styles.statNumber}>{stat2.count.toLocaleString()}+</span>
              <span className={styles.statLabel}>{t.stats.patients}</span>
            </div>
            <div className={styles.statItem} ref={stat3.ref}>
              <CalendarCheck size={32} className={styles.statIcon} />
              <span className={styles.statNumber}>{stat3.count.toLocaleString()}+</span>
              <span className={styles.statLabel}>{t.stats.consultations}</span>
            </div>
            <div className={styles.statItem} ref={stat4.ref}>
              <Award size={32} className={styles.statIcon} />
              <span className={styles.statNumber}>{stat4.count}%</span>
              <span className={styles.statLabel}>{t.stats.rating}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className="section-header">
            <h2>{t.sections.services}</h2>
            <p>{t.sections.whyChooseUs}</p>
          </div>
          <div className={styles.featuresGrid}>
            {features.map((feature, i) => (
              <div key={i} className={styles.featureCard}>
                <div className={styles.featureIcon} style={{ background: `${feature.color}15`, color: feature.color }}>
                  {feature.icon}
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDesc}>{feature.desc}</p>
                <Link href="/doctors" className={styles.featureLink}>
                  {t.sections.learnMore} <ChevronRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Doctors */}
      <section className={styles.section} style={{ background: 'var(--bg-secondary)' }}>
        <div className={styles.container}>
          <div className={styles.sectionHeaderRow}>
            <div>
              <h2 className={styles.sectionTitle}>{t.sections.featuredDoctors}</h2>
              <p className={styles.sectionSubtitle}>{t.sections.featuredDoctorsDesc}</p>
            </div>
            <Link href="/doctors">
              <Button variant="outline" size="sm" icon={<ArrowRight size={16} />} iconPosition="right">
                {t.sections.viewAll}
              </Button>
            </Link>
          </div>
          <div className={styles.doctorsGrid}>
            {mockDoctors.slice(0, 4).map((doctor) => (
              <div key={doctor.id} className={styles.doctorCard}>
                <div className={styles.doctorAvatar}>
                  {getInitials(doctor.name)}
                </div>
                <h3 className={styles.doctorName}>{doctor.name}</h3>
                <Badge variant="info" size="sm">{doctor.specialization}</Badge>
                <div className={styles.doctorMeta}>
                  <div className={styles.doctorMetaItem}>
                    <Star size={14} fill="#f59e0b" color="#f59e0b" />
                    <span>{doctor.rating}</span>
                  </div>
                  <div className={styles.doctorMetaItem}>
                    <Clock size={14} />
                    <span>{doctor.experience_years} {t.doctorSearch.experience}</span>
                  </div>
                </div>
                <p className={styles.doctorSchedule}>{doctor.practice_schedule}</p>
                <Link href={`/doctors?id=${doctor.id}`}>
                  <Button variant="primary" fullWidth size="sm">
                    {t.sections.bookNow}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeaderRow}>
            <div>
              <h2 className={styles.sectionTitle}>{t.sections.latestArticles}</h2>
              <p className={styles.sectionSubtitle}>{t.sections.latestArticlesDesc}</p>
            </div>
            <Link href="/articles">
              <Button variant="outline" size="sm" icon={<ArrowRight size={16} />} iconPosition="right">
                {t.sections.viewAll}
              </Button>
            </Link>
          </div>
          <div className={styles.articlesGrid}>
            {/* Featured Article */}
            <div className={styles.articleFeatured}>
              <div className={styles.articleFeaturedImage}>
                <div className={styles.articleImagePlaceholder}>
                  <FileText size={48} />
                </div>
              </div>
              <div className={styles.articleFeaturedContent}>
                <Badge variant="accent" size="sm">{mockArticles[0].category}</Badge>
                <h3 className={styles.articleTitle}>{mockArticles[0].title}</h3>
                <p className={styles.articleExcerpt}>{mockArticles[0].excerpt}</p>
                <div className={styles.articleMeta}>
                  <span>{mockArticles[0].author}</span>
                  <span>·</span>
                  <span>{mockArticles[0].read_time} {t.articles.readTime}</span>
                </div>
                <Link href={`/articles/${mockArticles[0].slug}`}>
                  <Button variant="ghost" size="sm" icon={<ArrowRight size={16} />} iconPosition="right">
                    {t.sections.readMore}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Article List */}
            <div className={styles.articleList}>
              {mockArticles.slice(1, 4).map((article) => (
                <Link href={`/articles/${article.slug}`} key={article.id} className={styles.articleItem}>
                  <div className={styles.articleItemImage}>
                    <div className={styles.articleImagePlaceholderSm}>
                      <FileText size={24} />
                    </div>
                  </div>
                  <div className={styles.articleItemContent}>
                    <Badge variant="default" size="sm">{article.category}</Badge>
                    <h4 className={styles.articleItemTitle}>{article.title}</h4>
                    <span className={styles.articleItemMeta}>
                      {article.read_time} {t.articles.readTime} · {formatDate(article.published_at)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Promos */}
      <section className={styles.section} style={{ background: 'var(--bg-secondary)' }}>
        <div className={styles.container}>
          <div className={styles.sectionHeaderRow}>
            <div>
              <h2 className={styles.sectionTitle}>{t.sections.activePromos}</h2>
              <p className={styles.sectionSubtitle}>{t.sections.activePromosDesc}</p>
            </div>
            <Link href="/promos">
              <Button variant="outline" size="sm" icon={<ArrowRight size={16} />} iconPosition="right">
                {t.sections.viewAll}
              </Button>
            </Link>
          </div>
          <div className={styles.promosGrid}>
            {mockPromos.slice(0, 3).map((promo) => (
              <div key={promo.id} className={styles.promoCard}>
                <div className={styles.promoImageWrapper}>
                  <div className={styles.promoImagePlaceholder}>
                    <Sparkles size={32} />
                    <span>{promo.discount_percentage}% OFF</span>
                  </div>
                  <div className={styles.promoBadge}>
                    {getDaysLeft(promo.valid_until)} {t.promos.daysLeft}
                  </div>
                </div>
                <div className={styles.promoContent}>
                  <h3 className={styles.promoTitle}>{promo.title}</h3>
                  <p className={styles.promoDesc}>{promo.description}</p>
                  <div className={styles.promoFooter}>
                    <span className={styles.promoCode}>{promo.code}</span>
                    <Button variant="accent" size="sm">{t.promos.claimNow}</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>{t.hero.title}</h2>
          <p className={styles.ctaSubtitle}>{t.hero.subtitle}</p>
          <div className={styles.ctaButtons}>
            <Link href="/register">
              <Button variant="accent" size="lg">{t.hero.cta}</Button>
            </Link>
            <Link href="/doctors">
              <Button variant="outline" size="lg" className={styles.ctaOutline}>
                {t.nav.doctors}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
