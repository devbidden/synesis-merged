import { useState } from 'react'
import './cancel-subscription.css'
import TelegramFloat from './TelegramFloat'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export default function CancelSubscriptionPage() {
  const [form, setForm] = useState({ licenseKey: '', email: '' })
  const [state, setState] = useState({ busy: false, message: '', error: false, effectiveAt: null })

  async function submit(event) {
    event.preventDefault()
    setState({ busy: true, message: '', error: false, effectiveAt: null })
    try {
      const response = await fetch(`${API_URL}/api/payment/cancel-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: form.licenseKey.trim(), email: form.email.trim() }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not submit your cancellation request.')
      setState({ busy: false, message: result.message, error: false, effectiveAt: result.effectiveAt || null })
    } catch (error) {
      setState({ busy: false, message: error.message || 'Could not reach the Synesis service. Please try again.', error: true, effectiveAt: null })
    }
  }

  return (
    <main className="cancel-page">
      <header className="cancel-header">
        <a href="/" className="cancel-brand"><img src="/logo.png" alt="Synesis" /></a>
        <a href="/" className="cancel-home-link">← Back to SynesisBot</a>
      </header>
      <section className="cancel-panel" aria-labelledby="cancel-title">
        <div className="cancel-icon" aria-hidden="true">↻</div>
        <p className="cancel-kicker">SUBSCRIPTION MANAGEMENT</p>
        <h1 id="cancel-title">Cancel your monthly plan</h1>
        <p className="cancel-intro">Enter the license key and email address used for your purchase. We’ll stop future renewals and send you a confirmation on this page.</p>

        <form className="cancel-form" onSubmit={submit}>
          <label>License key
            <input required autoComplete="off" value={form.licenseKey} onChange={(event) => setForm({ ...form, licenseKey: event.target.value })} placeholder="SYN-XXXX-XXXX-XXXX" />
          </label>
          <label>Purchase email
            <input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" />
          </label>
          <button type="submit" disabled={state.busy}>{state.busy ? 'Submitting request…' : 'Cancel subscription'}</button>
          {state.message && <div className={`cancel-result ${state.error ? 'error' : 'success'}`} role={state.error ? 'alert' : 'status'}>
            <strong>{state.error ? 'We couldn’t complete that request' : 'Request received'}</strong>
            <p>{state.message}</p>
            {!state.error && state.effectiveAt && <p>Your access remains active until <strong>{new Date(state.effectiveAt).toLocaleDateString()}</strong>.</p>}
          </div>}
        </form>

        <div className="cancel-policy"><strong>What happens next?</strong><p>Your subscription stays active until the end of the current billing period. You can continue using your license until then, and you won’t be charged for another period.</p></div>
        <p className="cancel-support">Need help? <a href="mailto:support@synesisbot.com">Contact Synesis support</a>.</p>
      </section>
      <TelegramFloat />
    </main>
  )
}
