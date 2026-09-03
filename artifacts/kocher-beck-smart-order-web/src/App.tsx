import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Form } from '@/components/ui/form';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  getGetProductsQueryKey,
  getGetOrderQueryKey,
  getGetOrdersQueryKey,
  getHealthCheckQueryKey,
  useCreateOrder,
  useGetOrder,
  useGetOrders,
  useGetProducts,
  useHealthCheck,
} from '@workspace/api-client-react';
import type { FieldDefinition, Order, OrderSummary, ProductDefinition } from '@workspace/api-client-react';
import { useForm } from 'react-hook-form';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Boxes,
  Check,
  ChevronRight,
  ClipboardList,
  CloudUpload,
  FileText,
  Gauge,
  House,
  LoaderCircle,
  Menu,
  PackageCheck,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import companyLogo from './assets/company-logo.png';
import companyLogoIcon from './assets/company-logo-icon.png';
import './index.css';

const queryClient = new QueryClient();
const draftStorageKey = 'kocher-beck-smart-order-draft';
type FieldValues = Record<string, string>;
type FilesByField = Record<string, File[]>;

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function formatTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-red-900" data-testid="state-error">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        <div>
          <p className="text-sm font-extrabold">The control desk is unavailable</p>
          <p className="mt-1 text-xs leading-5 text-red-800/75">{message}</p>
        </div>
      </div>
      {onRetry && <button className="quiet-button border-red-200 bg-red-100/60 text-red-900" onClick={onRetry} data-testid="button-retry"><RefreshCw className="h-3.5 w-3.5" /> Try again</button>}
    </div>
  );
}

function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3" data-testid="state-loading">
      {Array.from({ length: count }).map((_, index) => (
        <div className="shimmer h-[76px] rounded-xl border border-transparent" key={index} />
      ))}
    </div>
  );
}

function EmptyOrders({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card)/.45)] text-center ${compact ? 'px-5 py-9' : 'px-6 py-16'}`} data-testid="state-empty-orders">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">
        <ClipboardList className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-extrabold">No submitted orders yet</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[hsl(var(--muted-foreground))]">When your first tooling request is submitted, it will appear here with its production reference.</p>
      {!compact && <Link href="/new-order" className="primary-button mt-5" data-testid="link-empty-new-order"><PackageCheck className="h-4 w-4" /> Start an order</Link>}
    </div>
  );
}

function OrderRow({ order }: { order: OrderSummary }) {
  return (
    <Link href={`/orders/${order.id}`} className="order-row group grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl p-4 sm:grid-cols-[1.2fr_1fr_.7fr_auto]" data-testid={`row-order-${order.id}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono-ui text-[11px] font-medium text-[hsl(var(--primary))]">{order.order_number}</span>
          <span className="status-pill">Received</span>
        </div>
        <p className="mt-2 truncate text-sm font-extrabold">{order.product_name || order.product_type}</p>
      </div>
      <div className="hidden min-w-0 sm:block">
        <p className="truncate text-xs font-semibold">{order.client || 'Client not specified'}</p>
        <p className="mt-1 truncate text-[11px] text-[hsl(var(--muted-foreground))]">{order.contact || 'No contact provided'}</p>
      </div>
      <div className="hidden text-right sm:block">
        <p className="font-mono-ui text-[11px] text-[hsl(var(--foreground)/.72)]">{formatDate(order.created_at)}</p>
        <p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">{formatTime(order.created_at)}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] transition-transform group-hover:translate-x-1 group-hover:text-[hsl(var(--primary))]" />
    </Link>
  );
}

function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (open: boolean) => void }) {
  const [location] = useLocation();
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const navItems = [
    { href: '/', label: 'Overview', icon: House },
    { href: '/orders', label: 'Orders', icon: ClipboardList },
    { href: '/new-order', label: 'New order', icon: PackageCheck },
  ];
  return (
    <>
      {mobileOpen && <button className="fixed inset-0 z-30 bg-[hsl(220_23%_13%/.32)] md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" data-testid="button-close-navigation" />}
      <aside className={`sidebar-grid fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 transition-transform duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-start justify-between">
          <Link href="/" onClick={() => setMobileOpen(false)} data-testid="link-sidebar-logo">
            <img src={companyLogo} alt="Kocher+Beck" className="h-auto w-[170px] mix-blend-multiply" />
          </Link>
          <button className="icon-button md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" data-testid="button-close-navigation-icon"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-12">
          <p className="eyebrow px-3 text-[hsl(var(--muted-foreground))]">Workspace</p>
          <nav className="mt-3 space-y-1" aria-label="Primary navigation">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = href === '/' ? location === '/' : location.startsWith(href);
              return (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition-colors ${active ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--card))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]'}`} data-testid={`link-nav-${label.toLowerCase().replace(' ', '-')}`}>
                  <Icon className={`h-[17px] w-[17px] ${active ? 'text-[hsl(var(--primary))]' : ''}`} /> {label}
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" />}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto">
          <div className="mb-5 h-px bg-[hsl(var(--border))]" />
          <Link href="/profile" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold ${location === '/profile' ? 'bg-[hsl(var(--secondary))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]'}`} data-testid="link-nav-profile">
            <UserRound className="h-[17px] w-[17px]" /> Profile <ChevronRight className="ml-auto h-3.5 w-3.5" />
          </Link>
          <div className="mt-5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background)/.55)] p-3.5">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${health.isError ? 'bg-red-500' : 'bg-emerald-500'}`} />
              <span className="font-mono-ui text-[10px] font-medium uppercase tracking-[.1em] text-[hsl(var(--muted-foreground))]">{health.isError ? 'API offline' : 'API connected'}</span>
            </div>
            <p className="mt-2 text-[11px] leading-4 text-[hsl(var(--muted-foreground))]">Smart Order control desk<br />Kocher+Beck customer portal</p>
          </div>
        </div>
      </aside>
    </>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const title = location === '/' ? 'Overview' : location === '/orders' ? 'Submitted orders' : location === '/new-order' ? 'New tooling order' : location === '/profile' ? 'Profile & drafts' : 'Order detail';
  return (
    <div className="app-shell">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="min-h-[100dvh] md:pl-[272px]">
        <header className="sticky top-0 z-20 flex h-[74px] items-center justify-between border-b border-[hsl(var(--border)/.8)] bg-[hsl(var(--background)/.88)] px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button className="icon-button md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation" data-testid="button-open-navigation"><Menu className="h-5 w-5" /></button>
            <div>
              <p className="eyebrow text-[hsl(var(--muted-foreground))]">Smart Order / {new Date().getFullYear()}</p>
              <h1 className="mt-0.5 text-sm font-extrabold tracking-tight">{title}</h1>
            </div>
          </div>
          <Link href="/new-order" className="primary-button" data-testid="button-header-new-order"><PackageCheck className="h-4 w-4" /><span className="hidden sm:inline">New order</span><span className="sm:hidden">Order</span></Link>
        </header>
        <main className="page-enter mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12">{children}</main>
      </div>
    </div>
  );
}

function OverviewPage() {
  const orders = useGetOrders();
  const data = orders.data ?? [];
  const latest = data.slice(0, 4);
  return (
    <div className="space-y-9">
      <section className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
        <div className="max-w-3xl">
          <p className="eyebrow text-[hsl(var(--primary))]">Customer production desk</p>
          <h2 className="display-title mt-4 text-5xl font-extrabold sm:text-7xl">Precision, ready<br /><span className="text-[hsl(var(--primary))]">when you are.</span></h2>
          <p className="mt-6 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">Configure your tooling request with the same confidence you bring to the press. Smart Order keeps every specification, technical file, and production reference in one place.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/new-order" className="primary-button" data-testid="button-start-order"><PackageCheck className="h-4 w-4" /> Configure tooling</Link>
            <Link href="/orders" className="quiet-button" data-testid="link-view-all-orders">View all orders <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-[hsl(var(--foreground))] p-6 text-[hsl(var(--card))] shadow-[var(--shadow-md)]">
          <div className="absolute -right-8 -top-10 h-44 w-44 rounded-full border-[28px] border-[hsl(var(--primary)/.8)]" />
          <div className="absolute bottom-0 right-12 h-20 w-20 rounded-full border-[12px] border-[hsl(var(--card)/.1)]" />
          <img src={companyLogoIcon} alt="" className="relative h-12 w-12 object-cover object-center mix-blend-screen opacity-90" />
          <p className="eyebrow relative mt-14 text-[hsl(var(--primary))]">Order protocol</p>
          <p className="relative mt-2 max-w-[230px] text-xl font-extrabold leading-tight">From specification to shop floor.</p>
          <p className="relative mt-3 text-xs leading-5 text-[hsl(var(--card)/.64)]">A clear digital handoff for precision tooling.</p>
        </div>
      </section>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total orders', value: data.length.toString().padStart(2, '0'), icon: ClipboardList },
          { label: 'Latest reference', value: data[0]?.order_number ?? '—', icon: Gauge, mono: true },
          { label: 'Tooling types', value: new Set(data.map((order) => order.product_type)).size.toString().padStart(2, '0'), icon: Boxes },
          { label: 'Desk status', value: 'Live', icon: ShieldCheck },
        ].map(({ label, value, icon: Icon, mono }) => (
          <div className="metric-card p-4 sm:p-5" key={label} data-testid={`metric-${label.toLowerCase().replace(' ', '-')}`}>
            <div className="flex items-center justify-between"><span className="eyebrow text-[hsl(var(--muted-foreground))]">{label}</span><Icon className="h-4 w-4 text-[hsl(var(--primary))]" /></div>
            <p className={`mt-4 truncate text-2xl font-extrabold ${mono ? 'font-mono-ui text-base' : ''}`}>{value}</p>
          </div>
        ))}
      </section>
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div><p className="eyebrow text-[hsl(var(--muted-foreground))]">Production log</p><h3 className="mt-1 text-xl font-extrabold">Latest submitted orders</h3></div>
          <Link href="/orders" className="hidden text-xs font-extrabold text-[hsl(var(--primary))] sm:inline-flex sm:items-center sm:gap-1" data-testid="link-latest-see-all">See all <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        {orders.isLoading ? <SkeletonRows count={3} /> : orders.isError ? <ErrorNotice message="We could not load the latest production log." onRetry={() => void orders.refetch()} /> : latest.length === 0 ? <EmptyOrders /> : <div className="space-y-3">{latest.map((order) => <OrderRow key={order.id} order={order} />)}</div>}
      </section>
    </div>
  );
}

function OrdersPage() {
  const orders = useGetOrders();
  const [search, setSearch] = useState('');
  const list = useMemo(() => {
    const source = orders.data ?? [];
    const needle = search.trim().toLowerCase();
    return needle ? source.filter((order) => [order.order_number, order.product_name, order.product_type, order.client, order.contact].join(' ').toLowerCase().includes(needle)) : source;
  }, [orders.data, search]);
  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="eyebrow text-[hsl(var(--primary))]">Production log</p><h2 className="display-title mt-3 text-4xl font-extrabold sm:text-5xl">Every order,<br />accounted for.</h2><p className="mt-4 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">Your submitted requests and their production references, in one clear view.</p></div>
        <div className="flex items-center gap-2"><button className="quiet-button" onClick={() => void orders.refetch()} disabled={orders.isFetching} data-testid="button-refresh-orders"><RefreshCw className={`h-4 w-4 ${orders.isFetching ? 'animate-spin' : ''}`} /> Refresh</button><Link href="/new-order" className="primary-button" data-testid="button-orders-new-order"><PackageCheck className="h-4 w-4" /> New order</Link></div>
      </section>
      <div className="flex flex-col gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.58)] p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="field-control pl-10" placeholder="Search reference, client, or tooling type" aria-label="Search orders" data-testid="input-search-orders" /></div>
        <div className="flex items-center gap-2 px-1 text-xs text-[hsl(var(--muted-foreground))]"><SlidersHorizontal className="h-4 w-4" /><span data-testid="text-order-count">{list.length} {list.length === 1 ? 'order' : 'orders'}</span></div>
      </div>
      {orders.isLoading ? <SkeletonRows /> : orders.isError ? <ErrorNotice message="We could not retrieve your submitted orders." onRetry={() => void orders.refetch()} /> : list.length === 0 && !search ? <EmptyOrders /> : list.length === 0 ? <div className="rounded-xl border border-dashed border-[hsl(var(--border))] p-12 text-center" data-testid="state-empty-search"><Search className="mx-auto h-6 w-6 text-[hsl(var(--muted-foreground))]" /><p className="mt-3 text-sm font-extrabold">No matching orders</p><button className="quiet-button mt-4" onClick={() => setSearch('')} data-testid="button-clear-search">Clear search</button></div> : <div className="space-y-3">{list.map((order) => <OrderRow key={order.id} order={order} />)}</div>}
    </div>
  );
}

function ProductPicker({ products, selectedKey, onSelect }: { products: ProductDefinition[]; selectedKey: string; onSelect: (key: string) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {products.map((product, index) => {
        const selected = product.key === selectedKey;
        return (
          <button type="button" key={product.key} onClick={() => onSelect(product.key)} className={`group relative rounded-xl border p-5 text-left transition-all ${selected ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.055)] shadow-[0_0_0_3px_hsl(var(--primary)/.09)]' : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:-translate-y-0.5 hover:border-[hsl(var(--foreground)/.3)]'}`} data-testid={`button-product-${product.key}`}>
            <span className={`font-mono-ui text-[10px] ${selected ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`}>0{index + 1}</span>
            <span className="mt-8 block text-base font-extrabold">{product.name}</span>
            <span className="mt-2 block text-xs text-[hsl(var(--muted-foreground))]">{product.fields.length} configuration {product.fields.length === 1 ? 'parameter' : 'parameters'}</span>
            <span className={`absolute right-4 top-4 grid h-5 w-5 place-items-center rounded-full border ${selected ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white' : 'border-[hsl(var(--border))] text-transparent'}`}><Check className="h-3 w-3" /></span>
          </button>
        );
      })}
    </div>
  );
}

function DynamicField({ field, value, files, onValueChange, onFileChange, error }: { field: FieldDefinition; value: string; files: File[]; onValueChange: (value: string) => void; onFileChange: (files: File[]) => void; error?: string }) {
  return (
    <div>
      <label className="mb-2 flex items-baseline justify-between gap-3 text-xs font-extrabold" htmlFor={`field-${field.key}`}>
        <span>{field.label}{field.required && <span className="ml-1 text-[hsl(var(--primary))]">*</span>}</span>
        <span className="font-mono-ui text-[10px] font-normal text-[hsl(var(--muted-foreground))]">{field.type}</span>
      </label>
      {field.type === 'textarea' && <textarea id={`field-${field.key}`} value={value} onChange={(event) => onValueChange(event.target.value)} className="field-control min-h-[108px] resize-y" placeholder={`Enter ${field.label.toLowerCase()}`} data-testid={`input-field-${field.key}`} />}
      {field.type === 'text' && <input id={`field-${field.key}`} value={value} onChange={(event) => onValueChange(event.target.value)} className="field-control" placeholder={`Enter ${field.label.toLowerCase()}`} data-testid={`input-field-${field.key}`} />}
      {field.type === 'number' && <input id={`field-${field.key}`} type="number" value={value} onChange={(event) => onValueChange(event.target.value)} className="field-control" placeholder="0" data-testid={`input-field-${field.key}`} />}
      {field.type === 'select' && <select id={`field-${field.key}`} value={value} onChange={(event) => onValueChange(event.target.value)} className="field-control" data-testid={`input-field-${field.key}`}><option value="">Select {field.label.toLowerCase()}</option>{(field.options ?? []).map((option) => <option value={option} key={option}>{option}</option>)}</select>}
      {field.type === 'file' && <label className="file-drop flex min-h-[108px] cursor-pointer flex-col items-center justify-center rounded-lg px-4 py-5 text-center" htmlFor={`field-${field.key}`} data-testid={`dropzone-field-${field.key}`}><CloudUpload className="h-5 w-5 text-[hsl(var(--primary))]" /><span className="mt-2 text-xs font-extrabold">{files.length ? `${files.length} file${files.length === 1 ? '' : 's'} attached` : 'Attach technical file'}</span><span className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">PDF, DXF, AI, SVG or ZIP</span><input id={`field-${field.key}`} type="file" multiple className="sr-only" onChange={(event) => onFileChange(Array.from(event.target.files ?? []))} data-testid={`input-file-${field.key}`} />{files.length > 0 && <span className="mt-2 max-w-full truncate font-mono-ui text-[10px] text-[hsl(var(--primary))]">{files.map((file) => file.name).join(', ')}</span>}</label>}
      {error && <p className="mt-1.5 text-[11px] font-semibold text-[hsl(var(--destructive))]" data-testid={`error-field-${field.key}`}>{error}</p>}
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const labels = ['Tooling', 'Parameters', 'Review'];
  return <div className="flex items-center gap-2 sm:gap-4" data-testid="order-stepper">{labels.map((label, index) => <div className="flex items-center gap-2 sm:gap-4" key={label}><div className={`step-node ${step === index ? 'active' : step > index ? 'done' : ''}`}>{step > index ? <Check className="h-3.5 w-3.5" /> : index + 1}</div><span className={`hidden text-[11px] font-extrabold sm:inline ${step === index ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}>{label}</span>{index < labels.length - 1 && <div className="h-px w-6 bg-[hsl(var(--border))] sm:w-12" />}</div>)}</div>;
}

function NewOrderPage() {
  const products = useGetProducts({ query: { queryKey: getGetProductsQueryKey() } });
  const createOrder = useCreateOrder();
  const client = useQueryClient();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [selectedKey, setSelectedKey] = useState('');
  const [values, setValues] = useState<FieldValues>({});
  const [files, setFiles] = useState<FilesByField>({});
  const [clientName, setClientName] = useState('');
  const [contact, setContact] = useState('');
  const [comment, setComment] = useState('');
  const [validation, setValidation] = useState<Record<string, string>>({});
  const form = useForm<FieldValues>({ defaultValues: {} });
  const selectedProduct = products.data?.find((product) => product.key === selectedKey);

  useEffect(() => {
    const raw = localStorage.getItem(draftStorageKey);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as { productKey?: string; values?: FieldValues; client?: string; contact?: string; comment?: string };
      if (draft.productKey) setSelectedKey(draft.productKey);
      if (draft.values) { setValues(draft.values); form.reset(draft.values); }
      if (draft.client) setClientName(draft.client);
      if (draft.contact) setContact(draft.contact);
      if (draft.comment) setComment(draft.comment);
    } catch { localStorage.removeItem(draftStorageKey); }
  }, [form]);

  const saveDraft = (nextValues: FieldValues, nextKey = selectedKey, nextClient = clientName, nextContact = contact, nextComment = comment) => {
    localStorage.setItem(draftStorageKey, JSON.stringify({ productKey: nextKey, values: nextValues, client: nextClient, contact: nextContact, comment: nextComment, savedAt: new Date().toISOString() }));
  };
  const updateValue = (key: string, value: string) => {
    const next = { ...values, [key]: value };
    setValues(next); form.setValue(key, value); saveDraft(next);
  };
  const chooseProduct = (key: string) => {
    setSelectedKey(key); setValues({}); setFiles({}); setValidation({}); form.reset({}); saveDraft({}, key);
  };
  const validateParameters = () => {
    if (!selectedProduct) return false;
    const errors: Record<string, string> = {};
    selectedProduct.fields.forEach((field) => {
      if (!field.required) return;
      if (field.type === 'file' ? !files[field.key]?.length : !values[field.key]?.trim()) errors[field.key] = field.type === 'file' ? 'Attach at least one file.' : 'This parameter is required.';
    });
    setValidation(errors);
    return Object.keys(errors).length === 0;
  };
  const submitOrder = () => {
    if (!selectedProduct || !validateParameters()) { setStep(1); return; }
    createOrder.mutate({ data: { product_type: selectedProduct.key, client: clientName.trim() || undefined, contact: contact.trim() || undefined, comment: comment.trim() || undefined, data: JSON.stringify(values), files: Object.values(files).flat() } }, {
      onSuccess: (order: Order) => {
        localStorage.removeItem(draftStorageKey);
        client.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
        client.setQueryData(getGetOrderQueryKey(order.id), order);
        setLocation(`/orders/${order.id}`);
      },
    });
  };
  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-5 border-b border-[hsl(var(--border))] pb-7 sm:flex-row sm:items-end">
        <div><p className="eyebrow text-[hsl(var(--primary))]">Request builder</p><h2 className="display-title mt-3 text-4xl font-extrabold sm:text-5xl">Configure the<br />right tool.</h2><p className="mt-4 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">Select a product, provide the production parameters, and send your technical files. We will take it from there.</p></div>
        <Stepper step={step} />
      </section>
      {products.isLoading ? <SkeletonRows count={3} /> : products.isError ? <ErrorNotice message="Product definitions could not be loaded. Please try again." onRetry={() => void products.refetch()} /> : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(() => submitOrder())} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.58)] p-5 sm:p-7">
              {step === 0 && <div className="page-enter"><div className="mb-6 flex items-start justify-between"><div><p className="eyebrow text-[hsl(var(--muted-foreground))]">Step 01 / Product</p><h3 className="mt-2 text-xl font-extrabold">What are we making?</h3></div><Settings2 className="h-5 w-5 text-[hsl(var(--primary))]" /></div>{products.data?.length ? <ProductPicker products={products.data} selectedKey={selectedKey} onSelect={chooseProduct} /> : <div className="py-12 text-center text-sm text-[hsl(var(--muted-foreground))]" data-testid="state-empty-products">No tooling products are available.</div>}</div>}
              {step === 1 && selectedProduct && <div className="page-enter"><div className="mb-7"><p className="eyebrow text-[hsl(var(--muted-foreground))]">Step 02 / Parameters</p><h3 className="mt-2 text-xl font-extrabold">{selectedProduct.name}</h3><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Fields marked with <span className="text-[hsl(var(--primary))]">*</span> are needed to release the request.</p></div><div className="grid gap-5 sm:grid-cols-2">{selectedProduct.fields.map((field) => <DynamicField key={field.key} field={field} value={values[field.key] ?? ''} files={files[field.key] ?? []} onValueChange={(value) => updateValue(field.key, value)} onFileChange={(nextFiles) => { setFiles((current) => ({ ...current, [field.key]: nextFiles })); setValidation((current) => ({ ...current, [field.key]: '' })); }} error={validation[field.key]} />)}</div><div className="my-7 hairline" /><div className="grid gap-5 sm:grid-cols-2"><div><label className="mb-2 block text-xs font-extrabold" htmlFor="client-name">Client / company</label><input id="client-name" className="field-control" value={clientName} onChange={(event) => { setClientName(event.target.value); saveDraft(values, selectedKey, event.target.value, contact, comment); }} placeholder="e.g. Printworks GmbH" data-testid="input-client" /></div><div><label className="mb-2 block text-xs font-extrabold" htmlFor="contact">Contact</label><input id="contact" className="field-control" value={contact} onChange={(event) => { setContact(event.target.value); saveDraft(values, selectedKey, clientName, event.target.value, comment); }} placeholder="Email or phone" data-testid="input-contact" /></div><div className="sm:col-span-2"><label className="mb-2 block text-xs font-extrabold" htmlFor="comment">Production note <span className="font-normal text-[hsl(var(--muted-foreground))]">(optional)</span></label><textarea id="comment" className="field-control min-h-[96px] resize-y" value={comment} onChange={(event) => { setComment(event.target.value); saveDraft(values, selectedKey, clientName, contact, event.target.value); }} placeholder="Anything our production team should know?" data-testid="input-comment" /></div></div></div>}
              {step === 2 && selectedProduct && <div className="page-enter"><div className="mb-7"><p className="eyebrow text-[hsl(var(--muted-foreground))]">Step 03 / Review</p><h3 className="mt-2 text-xl font-extrabold">Ready for handoff?</h3><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Check the essentials before sending this request to Kocher+Beck.</p></div><div className="overflow-hidden rounded-lg border border-[hsl(var(--border))]"><div className="data-grid border-b border-[hsl(var(--border))]"><span className="bg-[hsl(var(--muted)/.55)] px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Product</span><span className="px-4 py-3 text-sm font-extrabold">{selectedProduct.name}</span></div><div className="data-grid border-b border-[hsl(var(--border))]"><span className="bg-[hsl(var(--muted)/.55)] px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Client</span><span className="px-4 py-3 text-sm">{clientName || 'Not specified'}</span></div><div className="data-grid border-b border-[hsl(var(--border))]"><span className="bg-[hsl(var(--muted)/.55)] px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Parameters</span><span className="px-4 py-3 text-sm">{Object.values(values).filter(Boolean).length} configured</span></div><div className="data-grid"><span className="bg-[hsl(var(--muted)/.55)] px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Files</span><span className="px-4 py-3 text-sm">{Object.values(files).flat().length} attached</span></div></div>{createOrder.isError && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800" data-testid="status-create-error"><AlertCircle className="mr-2 inline h-4 w-4" />The order could not be submitted. Check your connection and try again.</div>}<div className="mt-6 flex items-start gap-3 rounded-lg bg-[hsl(var(--accent)/.6)] p-4 text-xs leading-5 text-[hsl(var(--accent-foreground))]"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" /><span>Your request will receive a production reference immediately after submission. Keep it for future correspondence.</span></div></div>}
              <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-[hsl(var(--border))] pt-5 sm:flex-row"><button type="button" className="quiet-button" onClick={() => { if (step === 0) setLocation('/'); else setStep((current) => current - 1); }} data-testid="button-order-back"><ArrowLeft className="h-4 w-4" /> {step === 0 ? 'Cancel' : 'Back'}</button>{step < 2 ? <button type="button" className="primary-button" disabled={step === 0 && !selectedKey} onClick={() => { if (step === 1 && !validateParameters()) return; setStep((current) => current + 1); }} data-testid="button-order-continue">Continue <ArrowRight className="h-4 w-4" /></button> : <button type="submit" className="primary-button" disabled={createOrder.isPending} data-testid="button-submit-order">{createOrder.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{createOrder.isPending ? 'Submitting…' : 'Submit order'}</button>}</div>
            </div>
            <aside className="space-y-4">
              <div className="metric-card p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[hsl(var(--primary))]" /><p className="eyebrow text-[hsl(var(--muted-foreground))]">Secure handoff</p></div><p className="mt-3 text-xs leading-5 text-[hsl(var(--muted-foreground))]">Your technical information is sent directly to the Kocher+Beck production team.</p></div>
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--foreground))] p-5 text-[hsl(var(--card))]"><p className="eyebrow text-[hsl(var(--primary))]">Need a hand?</p><p className="mt-3 text-sm font-extrabold leading-5">Your local Kocher+Beck contact can help with specifications.</p><p className="mt-3 text-[11px] leading-5 text-[hsl(var(--card)/.65)]">Use the production note to flag anything that needs a conversation before release.</p></div>
            </aside>
          </form>
        </Form>
      )}
    </div>
  );
}

function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const orderQuery = useGetOrder(id, { query: { enabled: Number.isFinite(id), queryKey: getGetOrderQueryKey(id) } });
  const order = orderQuery.data;
  return (
    <div className="space-y-7">
      <Link href="/orders" className="inline-flex items-center gap-2 text-xs font-extrabold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]" data-testid="link-back-orders"><ArrowLeft className="h-4 w-4" /> Back to orders</Link>
      {orderQuery.isLoading ? <SkeletonRows count={3} /> : orderQuery.isError || !order ? <ErrorNotice message="This order could not be found or loaded." onRetry={() => void orderQuery.refetch()} /> : <OrderDetail order={order} />}
    </div>
  );
}

function OrderDetail({ order }: { order: Order }) {
  let parsedData: Record<string, string> = order.data ?? {};
  try { if (typeof order.data === 'string') parsedData = JSON.parse(order.data) as Record<string, string>; } catch { parsedData = {}; }
  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-5 border-b border-[hsl(var(--border))] pb-7 sm:flex-row sm:items-end">
        <div><p className="eyebrow text-[hsl(var(--primary))]">Order detail</p><div className="mt-3 flex flex-wrap items-center gap-3"><h2 className="display-title text-4xl font-extrabold sm:text-5xl" data-testid="text-order-number">{order.order_number}</h2><span className="status-pill">Received</span></div><p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Submitted {formatDate(order.created_at)} at {formatTime(order.created_at)}</p></div><Link href="/new-order" className="quiet-button" data-testid="button-detail-new-order"><PackageCheck className="h-4 w-4" /> New order</Link>
      </section>
      <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
        <section className="space-y-6">
          <div className="metric-card overflow-hidden"><div className="border-b border-[hsl(var(--border))] px-5 py-4"><p className="eyebrow text-[hsl(var(--muted-foreground))]">Tooling specification</p><h3 className="mt-1 text-lg font-extrabold">{order.product_name || order.product_type}</h3></div><div className="divide-y divide-[hsl(var(--border))]">{Object.keys(parsedData).length ? Object.entries(parsedData).map(([key, value]) => <div className="data-grid" key={key} data-testid={`detail-parameter-${key}`}><span className="bg-[hsl(var(--muted)/.45)] px-5 py-3 text-xs font-bold text-[hsl(var(--muted-foreground))]">{key.replace(/[_-]/g, ' ')}</span><span className="px-5 py-3 text-sm font-semibold">{value || '—'}</span></div>) : <p className="p-5 text-sm text-[hsl(var(--muted-foreground))]">No parameter values recorded.</p>}</div></div>
          <div className="metric-card"><div className="border-b border-[hsl(var(--border))] px-5 py-4"><p className="eyebrow text-[hsl(var(--muted-foreground))]">Technical files</p></div><div className="p-5">{order.files?.length ? <div className="space-y-2">{order.files.map((file, index) => <div className="flex items-center gap-3 rounded-lg bg-[hsl(var(--muted)/.55)] p-3" key={`${file}-${index}`} data-testid={`file-order-${index}`}><div className="grid h-8 w-8 place-items-center rounded-md bg-[hsl(var(--card))] text-[hsl(var(--primary))]"><FileText className="h-4 w-4" /></div><span className="min-w-0 flex-1 truncate font-mono-ui text-[11px]">{file}</span><span className="font-mono-ui text-[10px] text-[hsl(var(--muted-foreground))]">FILE {String(index + 1).padStart(2, '0')}</span></div>)}</div> : <p className="text-sm text-[hsl(var(--muted-foreground))]" data-testid="text-no-files">No technical files attached.</p>}</div></div>
        </section>
        <aside className="space-y-4">
          <div className="metric-card p-5"><p className="eyebrow text-[hsl(var(--muted-foreground))]">Order context</p><dl className="mt-5 space-y-4"><div><dt className="text-[10px] font-extrabold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Client</dt><dd className="mt-1 text-sm font-bold" data-testid="text-order-client">{order.client || 'Not specified'}</dd></div><div><dt className="text-[10px] font-extrabold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Contact</dt><dd className="mt-1 break-words text-sm font-bold" data-testid="text-order-contact">{order.contact || 'Not specified'}</dd></div><div><dt className="text-[10px] font-extrabold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Production note</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-5" data-testid="text-order-comment">{order.comment || 'No note supplied.'}</dd></div></dl></div>
          <div className="rounded-xl bg-[hsl(var(--accent))] p-5 text-[hsl(var(--accent-foreground))]"><div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4" /><p className="eyebrow">Reference saved</p></div><p className="mt-3 text-xs leading-5">Keep <strong className="font-mono-ui">{order.order_number}</strong> handy when speaking with your Kocher+Beck contact.</p></div>
        </aside>
      </div>
    </div>
  );
}

function ProfilePage() {
  const [draft, setDraft] = useState<{ productKey?: string; values?: FieldValues; client?: string; contact?: string; comment?: string; savedAt?: string } | null>(null);
  const products = useGetProducts({ query: { queryKey: getGetProductsQueryKey() } });
  useEffect(() => {
    const raw = localStorage.getItem(draftStorageKey);
    if (raw) { try { setDraft(JSON.parse(raw)); } catch { setDraft(null); } }
  }, []);
  const productName = products.data?.find((product) => product.key === draft?.productKey)?.name ?? draft?.productKey;
  return (
    <div className="space-y-8">
      <section><p className="eyebrow text-[hsl(var(--primary))]">Workspace settings</p><h2 className="display-title mt-3 text-4xl font-extrabold sm:text-5xl">Your Smart Order<br />context.</h2><p className="mt-4 max-w-lg text-sm leading-6 text-[hsl(var(--muted-foreground))]">Local drafts and product context for this browser. No account setup required to start configuring tooling.</p></section>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="metric-card p-5 sm:p-7"><div className="flex items-center justify-between gap-4"><div><p className="eyebrow text-[hsl(var(--muted-foreground))]">Saved locally</p><h3 className="mt-2 text-xl font-extrabold">Order drafts</h3></div><FileText className="h-5 w-5 text-[hsl(var(--primary))]" /></div>{draft ? <div className="mt-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background)/.5)] p-4" data-testid="card-local-draft"><div className="flex items-start justify-between gap-4"><div><span className="status-pill">In progress</span><p className="mt-4 text-sm font-extrabold">{productName || 'Product not selected'}</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{Object.values(draft.values ?? {}).filter(Boolean).length} parameters entered{draft.savedAt ? ` · saved ${formatDate(draft.savedAt)}` : ''}</p></div><Link href="/new-order" className="quiet-button" data-testid="button-resume-draft">Resume <ArrowRight className="h-3.5 w-3.5" /></Link></div><div className="mt-4 flex flex-wrap gap-2 text-[11px] text-[hsl(var(--muted-foreground))]">{draft.client && <span className="rounded bg-[hsl(var(--secondary))] px-2 py-1">Client: {draft.client}</span>}{draft.contact && <span className="rounded bg-[hsl(var(--secondary))] px-2 py-1">Contact added</span>}</div></div> : <div className="mt-6 rounded-xl border border-dashed border-[hsl(var(--border))] px-5 py-12 text-center" data-testid="state-empty-draft"><FileText className="mx-auto h-6 w-6 text-[hsl(var(--muted-foreground))]" /><p className="mt-3 text-sm font-extrabold">No local drafts</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Your in-progress order will be saved here automatically.</p></div>}</section>
        <aside className="space-y-4"><div className="rounded-xl bg-[hsl(var(--foreground))] p-5 text-[hsl(var(--card))]"><img src={companyLogo} alt="Kocher+Beck" className="h-auto w-[150px] brightness-0 invert opacity-90" /><div className="mt-10"><p className="eyebrow text-[hsl(var(--primary))]">Product context</p><p className="mt-3 text-sm font-extrabold leading-5">Precision tooling for the print industry.</p><p className="mt-3 text-[11px] leading-5 text-[hsl(var(--card)/.62)]">Smart Order connects your requirements with the people and production systems behind Kocher+Beck.</p></div></div><div className="metric-card p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[hsl(var(--primary))]" /><p className="eyebrow text-[hsl(var(--muted-foreground))]">Browser storage</p></div><p className="mt-3 text-xs leading-5 text-[hsl(var(--muted-foreground))]">Drafts stay on this device until you submit or clear them.</p></div></aside>
      </div>
    </div>
  );
}

function NotFound() {
  return <div className="mx-auto max-w-xl py-24 text-center"><img src={companyLogoIcon} alt="" className="mx-auto h-20 w-20 object-cover object-center mix-blend-multiply" /><p className="eyebrow mt-8 text-[hsl(var(--primary))]">404 / Off the production line</p><h2 className="display-title mt-3 text-5xl font-extrabold">Nothing here.</h2><p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">That route does not exist in this control desk.</p><Link href="/" className="primary-button mt-7" data-testid="link-not-found-home"><House className="h-4 w-4" /> Return overview</Link></div>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return <AppShell><RoutedErrorBoundary><Switch><Route path="/" component={OverviewPage} /><Route path="/orders" component={OrdersPage} /><Route path="/orders/:id" component={OrderDetailPage} /><Route path="/new-order" component={NewOrderPage} /><Route path="/profile" component={ProfilePage} /><Route component={NotFound} /></Switch></RoutedErrorBoundary></AppShell>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;