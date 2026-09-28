import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LayoutDashboard, FileText, Users, Menu, X, Receipt } from 'lucide-react';

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Invoices', href: '/invoices', icon: FileText },
  { label: 'Clients', href: '/clients', icon: Users },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const path = router?.pathname || '/';
  const isActive = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

  const nav = (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors ${
            isActive(href) ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-canvas hover:text-ink'
          }`}
        >
          <Icon size={18} />
          {label}
        </Link>
      ))}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2 px-5 py-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] text-white" style={{ background: 'var(--gradient-header-primary)' }}>
        <Receipt size={18} />
      </span>
      <span className="font-serif text-lg font-bold text-ink">Billowry</span>
    </div>
  );

  const footer = (
    <div className="mt-auto flex items-center gap-3 border-t border-line px-5 py-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">BW</span>
      <div>
        <p className="text-sm font-semibold text-ink">Billing Team</p>
        <p className="text-xs text-muted">Workspace owner</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas">
      <aside className="no-print fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-white md:flex">
        {brand}
        {nav}
        {footer}
      </aside>

      <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-4 py-3 md:hidden">
        <span className="font-serif text-lg font-bold">Billowry</span>
        <button aria-label="Open menu" onClick={() => setOpen(true)} className="rounded-md p-2 hover:bg-canvas">
          <Menu size={20} />
        </button>
      </header>

      {open && (
        <div className="no-print fixed inset-0 z-40 md:hidden">
          <div data-testid="nav-backdrop" className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <aside role="dialog" aria-label="Navigation" className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-card">
            <div className="flex items-center justify-between pr-3">
              {brand}
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="rounded-md p-2 hover:bg-canvas">
                <X size={18} />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      )}

      <main className="px-4 py-6 md:ml-60 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}