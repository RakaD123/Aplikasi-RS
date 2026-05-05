'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './articles.module.css';
import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';
import Badge from '@/components/ui/Badge/Badge';
import { useI18n } from '@/lib/i18n';
import { mockArticles, articleCategories } from '@/lib/data/mock-data';
import { formatDate } from '@/lib/utils';
import { Search, FileText, Clock, User } from 'lucide-react';

export default function ArticlesPage() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const filtered = useMemo(() => {
    return mockArticles.filter((a) => {
      const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = !selectedCategory || a.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <section className={styles.header}>
          <div className={styles.container}>
            <h1 className={styles.title}>{t.articles.title}</h1>
            <p className={styles.subtitle}>{t.articles.subtitle}</p>

            <div className={styles.searchBar}>
              <Search size={20} className={styles.searchIcon} />
              <input
                type="text"
                placeholder={t.articles.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.categories}>
              <button
                className={`${styles.catChip} ${!selectedCategory ? styles.catActive : ''}`}
                onClick={() => setSelectedCategory('')}
              >
                {t.articles.allCategories}
              </button>
              {articleCategories.map((cat) => (
                <button
                  key={cat}
                  className={`${styles.catChip} ${selectedCategory === cat ? styles.catActive : ''}`}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.content}>
          <div className={styles.container}>
            <div className={styles.grid}>
              {filtered.map((article) => (
                <Link href={`/articles/${article.slug}`} key={article.id} className={styles.card}>
                  <div className={styles.cardImage}>
                    <div className={styles.cardImagePlaceholder}>
                      <FileText size={36} />
                    </div>
                  </div>
                  <div className={styles.cardContent}>
                    <Badge variant="accent" size="sm">{article.category}</Badge>
                    <h3 className={styles.cardTitle}>{article.title}</h3>
                    <p className={styles.cardExcerpt}>{article.excerpt}</p>
                    <div className={styles.cardMeta}>
                      <div className={styles.metaItem}>
                        <User size={14} />
                        <span>{article.author}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <Clock size={14} />
                        <span>{article.read_time} {t.articles.readTime}</span>
                      </div>
                    </div>
                    <span className={styles.cardDate}>{formatDate(article.published_at)}</span>
                  </div>
                </Link>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className={styles.noResults}>
                <Search size={48} />
                <h3>{t.common.noData}</h3>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
