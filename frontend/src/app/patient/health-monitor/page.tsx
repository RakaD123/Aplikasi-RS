'use client';
import { useState } from 'react';
import useSWR from 'swr';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import styles from '../../dashboard.module.css';
import { useI18n } from '@/lib/i18n';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import Modal from '@/components/ui/Modal/Modal';
import { Plus, TrendingUp, TrendingDown, Minus, Heart, Droplets, Thermometer, Weight } from 'lucide-react';
import { api } from '@/lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  bloodPressure: { icon: <Heart size={20} />, color: '#ef4444', bg: '#ef444415' },
  bloodSugar: { icon: <Droplets size={20} />, color: '#3b5cf8', bg: '#3b5cf815' },
  heartRate: { icon: <Heart size={20} />, color: '#ec4899', bg: '#ec489915' },
  weight: { icon: <Weight size={20} />, color: '#f59e0b', bg: '#f59e0b15' },
  cholesterol: { icon: <Droplets size={20} />, color: '#8b5cf6', bg: '#8b5cf615' },
  temperature: { icon: <Thermometer size={20} />, color: '#07c4af', bg: '#07c4af15' },
};

const unitMap: Record<string, string> = {
  bloodPressure: 'mmHg',
  bloodSugar: 'mg/dL',
  heartRate: 'bpm',
  weight: 'kg',
  cholesterol: 'mg/dL',
  temperature: '°C',
};

export default function HealthMonitorPage() {
  const { t } = useI18n();
  const d = t.dashboard;
  // Real-time auto-polling every 5 seconds
  const { data, mutate } = useSWR('/patient/health-logs', fetcher, { refreshInterval: 5000 });
  const logs = data?.logs || [];

  const [chartMetric, setChartMetric] = useState('heartRate');
  const [period, setPeriod] = useState('7');

  const trendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp size={14} color="#ef4444" />;
    if (trend === 'down') return <TrendingDown size={14} color="#22c55e" />;
    return <Minus size={14} color="var(--text-tertiary)" />;
  };

  const latestStats: any = {};
  ['bloodPressure', 'bloodSugar', 'heartRate', 'weight'].forEach(type => {
    const log = logs.find((l: any) => l.metric_type === type);
    if (log) latestStats[type] = log;
  });

  // Extract chart data
  const chartDataRaw = logs
    .filter((l: any) => l.metric_type === chartMetric && !isNaN(parseFloat(l.value)))
    .sort((a: any, b: any) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
  
  const periodDays = parseInt(period);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - periodDays);
  const chartData = chartDataRaw.filter((l: any) => new Date(l.recorded_at) >= cutoffDate);

  const svgWidth = 700;
  const svgHeight = 200;
  const padding = 20;
  let pathD = '';
  let fillD = '';
  let points: {x: number, y: number}[] = [];

  if (chartData.length > 1) {
    const values = chartData.map((l: any) => parseFloat(l.value));
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const xStep = (svgWidth - padding * 2) / (chartData.length - 1);
    
    points = chartData.map((l: any, i: number) => {
      const val = parseFloat(l.value);
      const x = padding + i * xStep;
      const y = svgHeight - padding - ((val - minVal) / range) * (svgHeight - padding * 2);
      return { x, y };
    });

    pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
    fillD = `${pathD} L ${points[points.length-1].x},${svgHeight} L ${points[0].x},${svgHeight} Z`;
  }

  return (
    <DashboardLayout role="patient">
      <div className={styles.page}>
        <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className={styles.greeting}>{d.healthMonitor}</h1>
            <p className={styles.greetingSub}>{d.trend}</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className={styles.statsGrid}>
          {[
            { type: 'bloodPressure', label: d.bloodPressure, defaultVal: '-', defaultUnit: 'mmHg' },
            { type: 'bloodSugar', label: d.bloodSugar, defaultVal: '-', defaultUnit: 'mg/dL' },
            { type: 'heartRate', label: d.heartRate, defaultVal: '-', defaultUnit: 'bpm' },
            { type: 'weight', label: d.weight, defaultVal: '-', defaultUnit: 'kg' },
          ].map((card, i) => {
            const cfg = typeConfig[card.type];
            const stat = latestStats[card.type];
            return (
              <div key={i} className={styles.statCard}>
                <div className={styles.statIconWrap} style={{ background: cfg.bg, color: cfg.color }}>{cfg.icon}</div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{stat ? stat.value : card.defaultVal} <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 400 }}>{stat ? stat.unit : card.defaultUnit}</span></span>
                  <span className={styles.statLabel}>{card.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chart */}
        <div className={styles.card} style={{ marginBottom: 'var(--space-6)' }}>
          <div className={styles.cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <h3 className={styles.cardTitle}>{d.trend}</h3>
              <select 
                value={chartMetric} 
                onChange={e => setChartMetric(e.target.value)}
                style={{ padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: 'var(--text-xs)', background: 'var(--bg-secondary)', outline: 'none', color: 'var(--text-primary)' }}
              >
                <option value="heartRate">{d.heartRate}</option>
                <option value="bloodSugar">{d.bloodSugar}</option>
                <option value="weight">{d.weight}</option>
                <option value="cholesterol">{d.cholesterol}</option>
                <option value="temperature">{d.temperature}</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {[{ v: '7', l: d.last7Days }, { v: '30', l: d.last30Days }, { v: '90', l: d.last90Days }].map(p => (
                <button key={p.v} onClick={() => setPeriod(p.v)} style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 600, border: 'none', cursor: 'pointer', background: period === p.v ? 'var(--primary-500)' : 'var(--gray-100)', color: period === p.v ? 'white' : 'var(--text-secondary)' }}>{p.l}</button>
              ))}
            </div>
          </div>
          <div className={styles.cardBody}>
            {chartData.length > 1 ? (
              <svg width="100%" height="200" viewBox="0 0 700 200" style={{ overflow: 'visible' }}>
                <defs><linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b5cf8" stopOpacity="0.2" /><stop offset="100%" stopColor="#3b5cf8" stopOpacity="0" /></linearGradient></defs>
                <path d={pathD} fill="none" stroke="#3b5cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d={fillD} fill="url(#chartGrad)" />
                {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="#3b5cf8" />)}
              </svg>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
                Data tidak cukup untuk menampilkan grafik.<br/>Tambahkan minimal 2 log kesehatan untuk membuat tren.
              </div>
            )}
          </div>
        </div>

        {/* Logs Table */}
        <div className={styles.card}>
          <div className={styles.cardHeader}><h3 className={styles.cardTitle}>{d.healthLog}</h3></div>
          <div className={styles.cardBodyNoPad}>
            <table className={styles.table}>
              <thead><tr><th>{d.date}</th><th>Type</th><th>{d.value}</th><th>{d.unit}</th><th>{d.trend}</th></tr></thead>
              <tbody>
                {logs.map((log: any) => {
                  const cfg = typeConfig[log.metric_type] || typeConfig.bloodPressure;
                  return (
                    <tr key={log.id}>
                      <td>{new Date(log.recorded_at).toLocaleDateString()}</td>
                      <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: cfg.color }}>{cfg.icon} {(d as any)[log.metric_type] || log.metric_type}</span></td>
                      <td style={{ fontWeight: 700 }}>{log.value}</td>
                      <td style={{ color: 'var(--text-tertiary)' }}>{log.unit}</td>
                      <td>{trendIcon(log.trend)}</td>
                    </tr>
                  );
                })}
                {logs.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-5)', color: 'var(--text-tertiary)' }}>Belum ada data kesehatan.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
