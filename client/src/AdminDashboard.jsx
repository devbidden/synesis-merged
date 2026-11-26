import { useEffect, useMemo, useState } from 'react'
import './admin.css'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const TOKEN_KEY = 'synesis-admin-session'
const PAGE_SIZE = 25
const sections = [
  ['overview', 'Overview'],
  ['licenses', 'Licenses'],
  ['users', 'Users'],
  ['paying-users', 'Paying users'],
  ['payments', 'Payments'],
]

async function request(path, { token, ...options } = {}) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Could not connect to the server. Check the backend connection and try again.')
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.success) throw new Error(data.message || 'The request could not be completed.')
  return data
}

function money(amount, currency = 'USD') {
  const value = Number(amount)
  if (!Number.isFinite(value)) return `${amount || '0'} ${currency}`
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value)
}

function date(value) {
  return value ? new Date(value).toLocaleDateString() : '—'
}

function Status({ children }) {
  return <span className={`admin-status status-${String(children || 'unknown').toLowerCase()}`}>{children || 'Unknown'}</span>
}

function Login({ onLogin }) {
  const [apiKey, setApiKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await request('/api/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ apiKey }),
      })
      sessionStorage.setItem(TOKEN_KEY, result.token)
      onLogin(result.token)
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-login-wrap">
      <form className="admin-login-card" onSubmit={submit}>
        <a href="/" className="admin-back-link">← SynesisBot website</a>
        <div className="admin-brand-mark">S</div>
        <p className="admin-eyebrow">SYNESISBOT ADMIN</p>
        <h1>Welcome back</h1>
        <p className="admin-subtitle">Sign in to manage licenses, customers, and payments.</p>
        <label className="admin-field">
          Admin API key
          <input autoFocus required type="password" autoComplete="current-password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Enter your admin key" />
        </label>
        {error && <p className="admin-alert admin-alert-error" role="alert">{error}</p>}
        <button className="admin-primary-button admin-full-button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="admin-login-footnote">Your session stays active in this browser tab for up to 8 hours.</p>
      </form>
    </div>
  )
}

function AdminDashboard() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '')
  const [section, setSection] = useState('overview')
  const [metrics, setMetrics] = useState(null)
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createBusy, setCreateBusy] = useState(false)
  const [licenseForm, setLicenseForm] = useState({ name: '', email: '', plan: 'MANUAL', duration: '' })

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY)
    setToken('')
    setMetrics(null)
    setRows([])
  }

  async function loadMetrics(currentToken) {
    const [licenses, active, paying, paid] = await Promise.all([
      request('/api/admin/licenses?limit=1', { token: currentToken }),
      request('/api/admin/licenses?status=ACTIVE&limit=1', { token: currentToken }),
      request('/api/admin/paying-users?limit=1', { token: currentToken }),
      request('/api/admin/payments?status=SUCCESS&limit=1', { token: currentToken }),
    ])
    setMetrics({ licenses: licenses.pagination.total, active: active.pagination.total, paying: paying.pagination.total, payments: paid.pagination.total })
  }

  async function loadRows(currentToken = token, currentPage = page, currentSection = section) {
    const route = currentSection === 'paying-users' ? 'paying-users' : currentSection
    if (!['licenses', 'users', 'paying-users', 'payments'].includes(route)) return
    setBusy(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: String(PAGE_SIZE) })
      if (route === 'licenses' && statusFilter) params.set('status', statusFilter)
      const result = await request(`/api/admin/${route}?${params}`, { token: currentToken })
      const key = route === 'users' || route === 'paying-users' ? 'users' : route
      setRows(result[key] || [])
      setPagination(result.pagination || { page: currentPage, limit: PAGE_SIZE, total: 0 })
    } catch (loadError) {
      if (/admin API key|required|invalid admin/i.test(loadError.message)) logout()
      setError(loadError.message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!token) return
    loadMetrics(token).catch((loadError) => {
      if (/admin API key|required|invalid admin/i.test(loadError.message)) logout()
      setError(loadError.message)
    })
  }, [token])

  useEffect(() => {
    if (token && section !== 'overview') loadRows(token, page, section)
  }, [token, section, page, statusFilter])

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(term))
  }, [rows, search])

  async function createLicense(event) {
    event.preventDefault()
    setCreateBusy(true)
    setError('')
    setNotice('')
    try {
      const body = { name: licenseForm.name, email: licenseForm.email, plan: licenseForm.plan }
      if (licenseForm.duration !== '') body.duration = Number(licenseForm.duration)
      const result = await request('/api/admin/licenses', { token, method: 'POST', body: JSON.stringify(body) })
      setNotice(`License created: ${result.license.licenseKey}`)
      setLicenseForm({ name: '', email: '', plan: 'MANUAL', duration: '' })
      setShowCreate(false)
      await loadRows(token, 1, 'licenses')
      setPage(1)
      await loadMetrics(token)
    } catch (createError) {
      setError(createError.message)
    } finally {
      setCreateBusy(false)
    }
  }

  async function revokeLicense(license) {
    if (!window.confirm(`Revoke the license for ${license.user?.email || 'this customer'}? This takes effect immediately.`)) return
    setError('')
    setNotice('')
    try {
      await request(`/api/admin/licenses/${encodeURIComponent(license._id)}/revoke`, { token, method: 'PATCH' })
      setNotice(`License ${license.licenseKey} revoked.`)
      await loadRows(token, page, 'licenses')
      await loadMetrics(token)
    } catch (revokeError) {
      setError(revokeError.message)
    }
  }

  if (!token) return <Login onLogin={setToken} />

  const pageCount = Math.max(1, Math.ceil(pagination.total / PAGE_SIZE))

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a href="/" className="admin-side-brand"><span className="admin-brand-mark small">S</span><span><strong>SynesisBot</strong><small>ADMIN CONSOLE</small></span></a>
        <p className="admin-side-label">WORKSPACE</p>
        <nav className="admin-side-nav" aria-label="Admin sections">
          {sections.map(([id, label]) => <button key={id} aria-label={label} title={label} className={section === id ? 'active' : ''} onClick={() => { setSection(id); setPage(1); setSearch(''); setError(''); }}>{label}</button>)}
        </nav>
        <div className="admin-side-footer"><span className="admin-online-dot" /> Secure admin session<button onClick={logout}>Sign out</button></div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar"><div><span className="admin-breadcrumb">Workspace /</span> {sections.find(([id]) => id === section)?.[1]}</div><div className="admin-topbar-actions"><a href="/" className="admin-view-site">View website ↗</a><button className="admin-mobile-logout" onClick={logout}>Sign out</button></div></header>
        <div className="admin-content">
          <div className="admin-page-heading"><div><p className="admin-eyebrow">SYNESISBOT MANAGEMENT</p><h1>{section === 'overview' ? 'Overview' : sections.find(([id]) => id === section)?.[1]}</h1><p>Manage customers, licenses, and billing activity.</p></div>{section === 'licenses' && <button className="admin-primary-button" onClick={() => setShowCreate(!showCreate)}>＋ Create license</button>}</div>

          {error && <p className="admin-alert admin-alert-error" role="alert">{error}</p>}
          {notice && <p className="admin-alert admin-alert-success" role="status">{notice}<button aria-label="Dismiss" onClick={() => setNotice('')}>×</button></p>}

          {section === 'overview' && (
            <>
              <div className="admin-metric-grid">
                <Metric title="Total licenses" value={metrics?.licenses} detail="Issued across all plans" icon="▤" />
                <Metric title="Active licenses" value={metrics?.active} detail="Currently valid" icon="✓" />
                <Metric title="Paying customers" value={metrics?.paying} detail="At least one successful payment" icon="$" />
                <Metric title="Successful payments" value={metrics?.payments} detail="Completed transactions" icon="↗" />
              </div>
              <div className="admin-welcome-panel"><div><span className="admin-panel-icon">✦</span><h2>Your business at a glance</h2><p>Use the sidebar to review customers and payments, or manage license access from the Licenses section.</p></div><button className="admin-secondary-button" onClick={() => { setSection('licenses'); setPage(1); }}>Manage licenses <span>→</span></button></div>
              <div className="admin-overview-note"><strong>Good to know</strong><p>Payment records update when Bachs confirms a transaction. License access can be revoked immediately from the Licenses table.</p></div>
            </>
          )}

          {section !== 'overview' && (
            <>
              {showCreate && section === 'licenses' && <form className="admin-create-form" onSubmit={createLicense}><div className="admin-form-heading"><div><h2>Create a license</h2><p>Issue a new license directly to a customer.</p></div><button type="button" className="admin-icon-button" onClick={() => setShowCreate(false)} aria-label="Close form">×</button></div><div className="admin-form-grid"><label className="admin-field">Customer name<input required value={licenseForm.name} onChange={(event) => setLicenseForm({ ...licenseForm, name: event.target.value })} placeholder="Full name" /></label><label className="admin-field">Email address<input required type="email" value={licenseForm.email} onChange={(event) => setLicenseForm({ ...licenseForm, email: event.target.value })} placeholder="customer@example.com" /></label><label className="admin-field">Plan<select value={licenseForm.plan} onChange={(event) => setLicenseForm({ ...licenseForm, plan: event.target.value })}><option value="MANUAL">Manual</option><option value="BASIC">Monthly</option><option value="SIX_MONTHS">Six months</option><option value="LIFETIME">Lifetime</option></select></label><label className="admin-field">Duration in days <span className="admin-optional">Optional</span><input type="number" min="1" step="1" value={licenseForm.duration} onChange={(event) => setLicenseForm({ ...licenseForm, duration: event.target.value })} placeholder="Leave blank for no expiry" /></label></div><div className="admin-form-actions"><button type="button" className="admin-secondary-button" onClick={() => setShowCreate(false)}>Cancel</button><button className="admin-primary-button" disabled={createBusy}>{createBusy ? 'Creating…' : 'Create license'}</button></div></form>}

              <div className="admin-table-toolbar"><label className="admin-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter this page…" /></label>{section === 'licenses' && <select className="admin-filter-select" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="EXPIRED">Expired</option><option value="REVOKED">Revoked</option></select>}<button className="admin-secondary-button admin-refresh-button" onClick={() => loadRows()} disabled={busy}>↻ Refresh</button></div>
              <div className="admin-table-card"><div className="admin-table-scroll"><Table section={section} rows={visibleRows} busy={busy} onRevoke={revokeLicense} /></div><div className="admin-table-footer"><span>{pagination.total ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, pagination.total)} of ${pagination.total}` : 'No records found'}</span><div className="admin-pagination"><button disabled={page <= 1 || busy} onClick={() => setPage(page - 1)}>← Previous</button><span>Page {page} of {pageCount}</span><button disabled={page >= pageCount || busy} onClick={() => setPage(page + 1)}>Next →</button></div></div></div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function Metric({ title, value, detail, icon }) {
  return <article className="admin-metric-card"><div className="admin-metric-top"><span>{title}</span><span className="admin-metric-icon">{icon}</span></div><strong>{value === null || value === undefined ? '—' : Number(value).toLocaleString()}</strong><small>{detail}</small></article>
}

function Table({ section, rows, busy, onRevoke }) {
  if (busy && !rows.length) return <div className="admin-table-empty">Loading records…</div>
  if (!rows.length) return <div className="admin-table-empty"><span>⌕</span><strong>No records to show</strong><small>Try refreshing or changing your filters.</small></div>

  if (section === 'licenses') return <table><thead><tr><th>Customer</th><th>License key</th><th>Plan</th><th>Status</th><th>Expires</th><th>Created</th><th /></tr></thead><tbody>{rows.map((license) => <tr key={license._id}><td><strong>{license.user?.name}</strong><small>{license.user?.email}</small></td><td><code>{license.licenseKey}</code></td><td>{license.plan?.replace('_', ' ')}</td><td><Status>{license.status}</Status></td><td>{date(license.expiresAt)}</td><td>{date(license.createdAt)}</td><td>{license.status !== 'REVOKED' && <button className="admin-row-action danger" onClick={() => onRevoke(license)}>Revoke</button>}</td></tr>)}</tbody></table>

  if (section === 'users') return <table><thead><tr><th>Customer</th><th>Licenses</th><th>First seen</th><th>Last activity</th></tr></thead><tbody>{rows.map((user) => <tr key={user._id}><td><strong>{user.name}</strong><small>{user.email}</small></td><td>{user.licenseCount}</td><td>{date(user.firstSeenAt)}</td><td>{date(user.lastSeenAt)}</td></tr>)}</tbody></table>

  if (section === 'paying-users') return <table><thead><tr><th>Customer</th><th>Successful payments</th><th>Total paid</th><th>Plans</th><th>Last payment</th></tr></thead><tbody>{rows.map((user) => <tr key={user._id}><td><strong>{user.name}</strong><small>{user.email}</small></td><td>{user.successfulPaymentCount}</td><td>{money(user.totalPaid, user.currency)}</td><td>{user.plans?.join(', ')}</td><td>{date(user.lastPaidAt)}</td></tr>)}</tbody></table>

  return <table><thead><tr><th>Customer</th><th>Reference</th><th>Plan</th><th>Amount</th><th>Status</th><th>License</th><th>Date</th></tr></thead><tbody>{rows.map((payment) => <tr key={payment._id}><td><strong>{payment.customer?.name}</strong><small>{payment.customer?.email}</small></td><td><code>{payment.reference}</code></td><td>{payment.plan?.replace('_', ' ')}</td><td>{money(payment.amount, payment.currency)}</td><td><Status>{payment.status}</Status></td><td>{payment.license?.licenseKey || '—'}</td><td>{date(payment.paidAt || payment.createdAt)}</td></tr>)}</tbody></table>
}

export default AdminDashboard
