export const themeTokens = {
  colors: {
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    primarySoft: '#EFF6FF',
    accent: '#F97316',
    accentSoft: '#FFF7ED',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    textPrimary: '#0F172A',
    textMuted: '#64748B',
    border: '#E2E8F0',
    success: '#16A34A',
    warning: '#F59E0B',
    danger: '#DC2626',
  },
  gradients: {
    headerPrimary: 'var(--gradient-header-primary)',
    panelDark: 'var(--gradient-panel-dark)',
    softSurface: 'var(--gradient-soft-surface)',
  },
  typography: {
    heading: '"Source Serif 4", Georgia, serif',
    body: '"Source Sans 3", system-ui, sans-serif',
    h1: { fontSize: '1.5rem', fontWeight: 700 },
    h2: { fontSize: '1.25rem', fontWeight: 600 },
    body1: { fontSize: '0.875rem', fontWeight: 400 },
    label: { fontSize: '0.75rem', fontWeight: 600 },
  },
  radius: { md: '10px', lg: '14px' },
};

export const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Draft' },
  sent: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Sent' },
  paid: { bg: 'bg-green-50', text: 'text-green-700', label: 'Paid' },
  overdue: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Overdue' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', label: 'Cancelled' },
};

export default themeTokens;