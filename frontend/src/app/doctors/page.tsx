'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './doctors.module.css';
import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import Badge from '@/components/ui/Badge/Badge';
import { useI18n } from '@/lib/i18n';
import { getInitials } from '@/lib/utils';
import { Search, Star, Clock, MapPin, Calendar, Users, Filter, X } from 'lucide-react';
import useSWR from 'swr';
import { api } from '@/lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function DoctorsPage() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch real data using SWR
  const { data: doctorsData, isLoading: isLoadingDoctors } = useSWR('/public/doctors', fetcher);
  const { data: specData } = useSWR('/public/doctors/specializations', fetcher);
  const { data: branchData } = useSWR('/public/doctors/branches', fetcher);

  const doctors = doctorsData?.data || [];
  const specializations = specData?.specializations || [];
  const branches = branchData?.branches || [];

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc: any) => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.specialization.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpec = !selectedSpec || doc.specialization === selectedSpec;
      const matchesBranch = !selectedBranch || doc.hospital_branch === selectedBranch;
      return matchesSearch && matchesSpec && matchesBranch;
    });
  }, [doctors, searchQuery, selectedSpec, selectedBranch]);

  const activeFilters = [selectedSpec, selectedBranch].filter(Boolean).length;

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        {/* Header */}
        <section className={styles.header}>
          <div className={styles.container}>
            <h1 className={styles.title}>{t.doctorSearch.title}</h1>
            <p className={styles.subtitle}>{t.doctorSearch.subtitle}</p>

            {/* Search & Filters */}
            <div className={styles.searchRow}>
              <div className={styles.searchBar}>
                <Search size={20} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder={t.doctorSearch.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              <Button
                variant={showFilters ? 'primary' : 'outline'}
                size="md"
                icon={<Filter size={18} />}
                onClick={() => setShowFilters(!showFilters)}
              >
                {t.common.filter}
                {activeFilters > 0 && <Badge variant="accent" size="sm">{activeFilters}</Badge>}
              </Button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className={styles.filterPanel}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>{t.doctorSearch.allSpecializations}</label>
                  <div className={styles.filterChips}>
                    <button
                      className={`${styles.chip} ${!selectedSpec ? styles.chipActive : ''}`}
                      onClick={() => setSelectedSpec('')}
                    >
                      {t.doctorSearch.allSpecializations}
                    </button>
                    {specializations.map((spec) => (
                      <button
                        key={spec}
                        className={`${styles.chip} ${selectedSpec === spec ? styles.chipActive : ''}`}
                        onClick={() => setSelectedSpec(selectedSpec === spec ? '' : spec)}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>{t.doctorSearch.allBranches}</label>
                  <div className={styles.filterChips}>
                    <button
                      className={`${styles.chip} ${!selectedBranch ? styles.chipActive : ''}`}
                      onClick={() => setSelectedBranch('')}
                    >
                      {t.doctorSearch.allBranches}
                    </button>
                    {branches.map((branch) => (
                      <button
                        key={branch}
                        className={`${styles.chip} ${selectedBranch === branch ? styles.chipActive : ''}`}
                        onClick={() => setSelectedBranch(selectedBranch === branch ? '' : branch)}
                      >
                        {branch}
                      </button>
                    ))}
                  </div>
                </div>
                {activeFilters > 0 && (
                  <Button variant="ghost" size="sm" icon={<X size={16} />} onClick={() => { setSelectedSpec(''); setSelectedBranch(''); }}>
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Results */}
        <section className={styles.results}>
          <div className={styles.container}>
            <p className={styles.resultCount}>
              {filteredDoctors.length} {filteredDoctors.length === 1 ? 'doctor' : 'doctors'} found
            </p>

            {isLoadingDoctors ? (
              <div className={styles.noResults}>
                <h3>Loading doctors...</h3>
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className={styles.noResults}>
                <Search size={48} />
                <h3>{t.doctorSearch.noResults}</h3>
              </div>
            ) : (
              <div className={styles.doctorGrid}>
                {filteredDoctors.map((doctor) => (
                  <div key={doctor.id} className={styles.doctorCard}>
                    <div className={styles.cardTop}>
                      <div className={styles.doctorAvatar}>
                        {getInitials(doctor.name)}
                      </div>
                      <div className={styles.doctorInfo}>
                        <h3 className={styles.doctorName}>{doctor.name}</h3>
                        <Badge variant="info" size="sm">{doctor.specialization}</Badge>
                      </div>
                    </div>

                    <div className={styles.doctorMeta}>
                      <div className={styles.metaItem}>
                        <Star size={16} fill="#f59e0b" color="#f59e0b" />
                        <span>{doctor.rating}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <Clock size={16} />
                        <span>{doctor.experience_years} {t.doctorSearch.experience}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <Users size={16} />
                        <span>{doctor.total_patients?.toLocaleString()} {t.doctorSearch.patients}</span>
                      </div>
                    </div>

                    <div className={styles.doctorDetail}>
                      <div className={styles.detailItem}>
                        <Calendar size={14} />
                        <span>Schedules Available</span>
                      </div>
                      <div className={styles.detailItem}>
                        <MapPin size={14} />
                        <span>{doctor.hospital_branch}</span>
                      </div>
                    </div>

                    {doctor.available_slots && doctor.available_slots.length > 0 && (
                      <div className={styles.slotsSection}>
                        <p className={styles.slotsLabel}>{t.doctorSearch.availableSlots}</p>
                        <div className={styles.slotsGrid}>
                          {doctor.available_slots.filter((s: any) => s.is_active).map((slot: any) => (
                            <span key={slot.id} className={styles.slot}>
                              {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <Link href={`/patient/booking?doctorId=${doctor.id}`} style={{ width: '100%' }}>
                      <Button variant="primary" fullWidth>
                        {t.doctorSearch.bookAppointment}
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
