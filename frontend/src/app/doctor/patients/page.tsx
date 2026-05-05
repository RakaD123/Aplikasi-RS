'use client';
import { useState } from 'react';
import useSWR from 'swr';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import styles from '../../dashboard.module.css';
import { useI18n } from '@/lib/i18n';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import Modal from '@/components/ui/Modal/Modal';
import { getInitials } from '@/lib/utils';
import { Search, FileText, Eye, Plus, TrendingUp, TrendingDown, Minus, Heart, Droplets, Thermometer, Weight, Activity } from 'lucide-react';
import { api } from '@/lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

const unitMap: Record<string, string> = {
  bloodPressure: 'mmHg',
  bloodSugar: 'mg/dL',
  heartRate: 'bpm',
  weight: 'kg',
  cholesterol: 'mg/dL',
  temperature: '°C',
};

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  bloodPressure: { icon: <Heart size={16} />, color: '#ef4444', bg: '#ef444415' },
  bloodSugar: { icon: <Droplets size={16} />, color: '#3b5cf8', bg: '#3b5cf815' },
  heartRate: { icon: <Activity size={16} />, color: '#ec4899', bg: '#ec489915' },
  weight: { icon: <Weight size={16} />, color: '#f59e0b', bg: '#f59e0b15' },
  cholesterol: { icon: <Droplets size={16} />, color: '#8b5cf6', bg: '#8b5cf615' },
  temperature: { icon: <Thermometer size={16} />, color: '#07c4af', bg: '#07c4af15' },
};

export default function PatientsPage() {
  const { t } = useI18n();
  const d = t.dashboard;
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  
  const { data: patientsData } = useSWR('/doctor/patients', fetcher);
  const patients = patientsData?.patients || [];

  const { data: detailData, mutate: mutateDetail } = useSWR(
    selected ? `/doctor/patients/${selected}` : null,
    fetcher
  );

  const detail = detailData?.patient;
  const bookings = detailData?.bookings || [];
  const healthLogs = detailData?.healthLogs || [];
  
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Health Log State
  const [showLogModal, setShowLogModal] = useState(false);
  const [savingLog, setSavingLog] = useState(false);
  const [logForm, setLogForm] = useState({
    metric_type: 'bloodPressure',
    value: '',
    unit: 'mmHg',
    recorded_at: new Date().toISOString().split('T')[0]
  });

  const trendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp size={14} color="#ef4444" />;
    if (trend === 'down') return <TrendingDown size={14} color="#22c55e" />;
    return <Minus size={14} color="var(--text-tertiary)" />;
  };

  const filtered = patients.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (id: string) => {
    setSelected(id);
    setIsEditing(false);
    setNotes('');
    setShowLogModal(false);
  };

  const latestBooking = bookings[0];

  const handleSaveNotes = async () => {
    if (!latestBooking) return;
    setSaving(true);
    try {
      await api.post(`/doctor/bookings/${latestBooking.id}/consultation`, {
        medical_notes: notes,
      });
      alert('Evaluasi medis berhasil disimpan!');
      mutateDetail();
      setIsEditing(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const handleEditNotes = () => {
    setNotes(latestBooking?.consultation?.medical_notes || '');
    setIsEditing(true);
  };

  const handleSaveLog = async () => {
    if (!selected) return;
    setSavingLog(true);
    try {
      await api.post(`/doctor/patients/${selected}/health-logs`, {
        ...logForm,
        recorded_at: logForm.recorded_at + 'T12:00:00Z'
      });
      setShowLogModal(false);
      mutateDetail();
      setLogForm({
        metric_type: 'bloodPressure',
        value: '',
        unit: 'mmHg',
        recorded_at: new Date().toISOString().split('T')[0]
      });
    } catch (e) {
      alert('Gagal menyimpan log kesehatan');
    } finally {
      setSavingLog(false);
    }
  };

  return (
    <DashboardLayout role="doctor">
      <div className={styles.page}>
        <div className={styles.header}><h1 className={styles.greeting}>{d.patientRecords}</h1></div>

        <div className={styles.grid2}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{d.searchPatient}</h3>
            </div>
            <div style={{ padding: 'var(--space-3) var(--space-5)' }}>
              <Input placeholder={d.searchPatient} icon={<Search size={16} />} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className={styles.cardBodyNoPad}>
              {filtered.map((p: any) => (
                <div key={p.id} className={styles.listItem} style={{ cursor: 'pointer', background: selected === p.id ? 'var(--primary-50)' : undefined }} onClick={() => handleSelect(p.id)}>
                  <div className={styles.listAvatar}>{getInitials(p.name)}</div>
                  <div className={styles.listInfo}>
                    <div className={styles.listName}>{p.name}</div>
                    <div className={styles.listSub}>{p.age}y · {p.gender} · {p.diagnosis}</div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--text-tertiary)' }}>No patients found</div>}
            </div>
          </div>

          {detail ? (
            <div className={styles.card}>
              <div className={styles.cardHeader}><h3 className={styles.cardTitle}>{d.viewProfile}</h3></div>
              <div className={styles.cardBody}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                  <div className={styles.listAvatar} style={{ width: 64, height: 64, margin: '0 auto var(--space-3)', fontSize: 'var(--text-lg)' }}>{getInitials(detail.name)}</div>
                  <h3 style={{ fontWeight: 700 }}>{detail.name}</h3>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>{detail.age} years · {detail.gender === 'M' ? 'Male' : 'Female'}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  {[
                    { l: d.bloodType, v: detail.bloodType },
                    { l: 'Phone', v: detail.phone },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 2 }}>{item.l}</div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{item.v}</div>
                    </div>
                  ))}
                </div>
                
                {latestBooking && (
                  <div style={{ marginTop: 'var(--space-6)', background: 'var(--bg-secondary)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                      <h4 style={{ fontWeight: 600, fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <FileText size={16} /> Evaluasi Konsultasi Terakhir
                      </h4>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        {new Date(latestBooking.appointment_time).toLocaleDateString()}
                      </span>
                    </div>

                    {isEditing ? (
                      <>
                        <textarea 
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Tuliskan evaluasi, diagnosa, dan catatan medis untuk pasien di sini..."
                          style={{ width: '100%', minHeight: '100px', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)', fontFamily: 'inherit' }}
                        />
                        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                          <Button variant="primary" size="sm" onClick={handleSaveNotes} loading={saving}>Simpan Evaluasi</Button>
                          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Batal</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', whiteSpace: 'pre-line' }}>
                          {latestBooking.consultation?.medical_notes || <span style={{ fontStyle: 'italic', color: 'var(--text-tertiary)' }}>Belum ada evaluasi medis untuk sesi ini.</span>}
                        </div>
                        <Button variant="outline" size="sm" onClick={handleEditNotes}>
                          {latestBooking.consultation?.medical_notes ? 'Edit Evaluasi' : 'Tulis Evaluasi'}
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {/* Health Logs Section */}
                <div style={{ marginTop: 'var(--space-6)', background: 'var(--bg-secondary)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                    <h4 style={{ fontWeight: 600, fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Activity size={16} /> Catatan Kesehatan
                    </h4>
                    <Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={() => setShowLogModal(true)}>
                      Tambah Log
                    </Button>
                  </div>
                  
                  {healthLogs.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
                        <tbody>
                          {healthLogs.map((log: any) => {
                            const cfg = typeConfig[log.metric_type] || typeConfig.bloodPressure;
                            return (
                              <tr key={log.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                <td style={{ padding: 'var(--space-2) 0', color: 'var(--text-tertiary)' }}>{new Date(log.recorded_at).toLocaleDateString()}</td>
                                <td style={{ padding: 'var(--space-2)' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: cfg.color }}>
                                    {cfg.icon} {(d as any)[log.metric_type] || log.metric_type}
                                  </span>
                                </td>
                                <td style={{ padding: 'var(--space-2)', fontWeight: 600 }}>
                                  {log.value} <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 400 }}>{log.unit}</span>
                                </td>
                                <td style={{ padding: 'var(--space-2)', textAlign: 'right' }}>{trendIcon(log.trend)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ fontSize: 'var(--text-sm)', fontStyle: 'italic', color: 'var(--text-tertiary)' }}>Belum ada data kesehatan pasien.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.card}>
              <div className={styles.emptyState}>
                <Eye size={48} />
                <h3>Pilih pasien untuk melihat detail</h3>
              </div>
            </div>
          )}
        </div>

        {/* Add Log Modal */}
        <Modal isOpen={showLogModal} onClose={() => setShowLogModal(false)} title="Tambah Log Kesehatan">
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Tipe</label>
              <select 
                value={logForm.metric_type}
                onChange={e => setLogForm({...logForm, metric_type: e.target.value, unit: unitMap[e.target.value]})}
                style={{ padding: 'var(--space-3)', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              >
                <option value="bloodPressure">{d.bloodPressure}</option>
                <option value="bloodSugar">{d.bloodSugar}</option>
                <option value="heartRate">{d.heartRate}</option>
                <option value="weight">{d.weight}</option>
                <option value="cholesterol">{d.cholesterol}</option>
                <option value="temperature">{d.temperature}</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Nilai</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div style={{ flex: 1 }}><Input placeholder="e.g. 120" value={logForm.value} onChange={e => setLogForm({...logForm, value: e.target.value})} /></div>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>{logForm.unit}</span>
              </div>
            </div>
            <div className={styles.formGroup}><Input label="Tanggal" type="date" value={logForm.recorded_at} onChange={e => setLogForm({...logForm, recorded_at: e.target.value})} /></div>
          </div>
          <div className={styles.formActions}>
            <Button variant="ghost" onClick={() => setShowLogModal(false)}>{t.common.cancel}</Button>
            <Button variant="primary" onClick={handleSaveLog} loading={savingLog}>{t.common.save}</Button>
          </div>
        </Modal>

      </div>
    </DashboardLayout>
  );
}
