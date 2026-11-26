import { useState } from 'react'
import './App.css'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const plans = [
  { id: 'BASIC', name: 'Monthly subscription', term: 'Monthly', price: '$20', detail: '7-day trial, then $20 per month' },
  { id: 'SIX_MONTHS', name: 'Six-month license', term: '6 months', price: '$100', detail: 'One-time payment' },
  { id: 'LIFETIME', name: 'Lifetime license', term: 'Lifetime', price: '$3,000', detail: 'One-time payment' },
]

const questions = [
  ['Which plan should I choose?', 'The monthly plan includes a 7-day trial. The six-month plan costs $100 once, and lifetime access costs $3,000 once.'],
  ['When will I receive my license?', 'After successful payment, your license key is created and sent to the email address you entered at checkout.'],
  ['Is the monthly plan recurring?', 'Yes. The monthly plan is $20 per month after its 7-day trial. The six-month and lifetime plans are one-time payments.'],
  ['What payment methods are accepted?', 'Available payment methods are shown securely at checkout.'],
]

const resultImages = Object.entries(import.meta.glob('./assets/results/**/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})).sort(([first], [second]) => first.localeCompare(second, undefined, { numeric: true }))
const resultSections = [
  { id: 'samples', title: 'Synesis EA account samples' },
  { id: 'settings', title: 'Synesis EA settings' },
  { id: 'live-accounts', title: 'Live account results' },
  { id: 'customer-accounts', title: 'Customer account results' },
  { id: 'backtests', title: 'Backtest samples' },
].map((section) => ({
  ...section,
  images: resultImages.filter(([path]) => path.includes(`/results/${section.id}/`)),
}))
const reviewPlaceholders = [1, 2, 3]


function ResultSample({ src, filename, number }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <figure className="result-card">
        <button
          type="button"
          className="result-image-button"
          onClick={() => setIsOpen(true)}
          aria-label={`Enlarge ${filename}`}
        >
          <div className="result-frame">
            <img
              src={src}
              alt={`Synesis EA performance sample ${number}`}
              loading="lazy"
            />
          </div>
        </button>

        <figcaption>{filename}</figcaption>
      </figure>

      {isOpen && (
        <div
          className="image-lightbox"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged result image"
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close image"
          >
            &times;
          </button>

          <img
            src={src}
            alt={`Enlarged Synesis EA performance sample ${number}`}
            className="lightbox-image"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

async function postJson(path, body) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Could not reach the checkout service. Check the backend connection and try again.')
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.success) throw new Error(data.message || 'The request could not be completed.')
  return data
}

function App() {
  const [openQuestion, setOpenQuestion] = useState(0)
  const [plan, setPlan] = useState('BASIC')
  const [checkout, setCheckout] = useState({ name: '', email: '' })
  const [paymentState, setPaymentState] = useState({ busy: false, message: '', error: false })
  const [cancellation, setCancellation] = useState({ licenseKey: '', email: '' })
  const [cancellationState, setCancellationState] = useState({ busy: false, message: '', error: false })

  async function startCheckout(event) {
    event.preventDefault()
    setPaymentState({ busy: true, message: '', error: false })
    try {
      const result = await postJson('/api/payment/initialize', {
        name: checkout.name.trim(),
        email: checkout.email.trim(),
        plan,
      })
      if (!result.checkoutUrl) throw new Error('Checkout link was not returned. Please try again.')
      window.location.assign(result.checkoutUrl)
    } catch (error) {
      setPaymentState({ busy: false, message: error.message, error: true })
    }
  }

  async function cancelSubscription(event) {
    event.preventDefault()
    setCancellationState({ busy: true, message: '', error: false })
    try {
      const result = await postJson('/api/payment/cancel-subscription', {
        licenseKey: cancellation.licenseKey.trim(),
        email: cancellation.email.trim(),
      })
      const effectiveAt = result.effectiveAt ? ` Your access remains available until ${new Date(result.effectiveAt).toLocaleDateString()}.` : ''
      setCancellationState({ busy: false, message: `${result.message}${effectiveAt}`, error: false })
    } catch (error) {
      setCancellationState({ busy: false, message: error.message, error: true })
    }
  }

  return (
    <main>
      <header className="brand-header">
        <div className="header-inner mx-auto flex max-w-7xl items-center justify-between gap-2 px-3">
          <a className="brand-mark" href="#top" aria-label="Synesis home"><img className="brand-logo" src="/logo.png" alt="Synesis" /></a>
          <nav className="main-nav" aria-label="Main navigation"><a href="#order">Order</a><a href="#manage-subscription">Cancel subscription</a><a href="#results">Results</a><a href="#features">Features</a><a href="#reviews">Reviews</a><a href="#guides">Guides</a><a href="#faq">FAQ</a><a href="#contact">Contact</a></nav>
        </div>
      </header>

      <section id="top" className="hero-section px-4 py-10 md:px-8">
        <div className="hero-showcase mx-auto max-w-6xl text-center">
          <div className="hero-copy mx-auto max-w-4xl">
            <h1 className="hero-title mt-2 text-3xl font-normal md:text-4xl">Synesis EA: Automated Trading for MetaTrader 5</h1>
            <p className="hero-subtitle mt-3 text-base">Choose a license plan and get started with Synesis.</p>
            <a className="purchase-button mt-5 inline-flex items-center justify-center px-6 py-3 font-bold" href="#order">View Synesis Plans</a>
          </div>
          <div className="hero-product-wrap mt-6"><img className="hero-product-image" src="/logo.png" alt="Synesis Expert Advisor" /></div>
        </div>
      </section>

      <section id="results" className="results-section px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="section-heading"><h2 className="section-title">Synesis EA Account Results</h2><p>Browse account screenshots and trading samples.</p></div>
          {resultImages.length > 0
            ? resultSections.filter((section) => section.images.length > 0).map((section) => (
              <div className="result-group" key={section.id}>
                <h3 className="result-heading">{section.title}</h3>
                <div className="results-grid">{section.images.map(([path, src], index) => <ResultSample key={path} src={src} filename={path.split('/').pop()} number={index + 1} />)}</div>
              </div>
            ))
            : <p className="results-empty mt-6 text-center">Add screenshots to a folder in <code>client/src/assets/results</code> to display them here.</p>}
          <p className="results-note mt-5 text-center text-sm">Trading results vary with market conditions, account settings and risk. Past performance does not guarantee future results.</p>
        </div>
      </section>

      <section id="order" className="offer-section px-5 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center"><p className="section-kicker">Order Synesis</p><h2 className="section-title mt-3">Choose your license</h2><p className="mt-4 leading-7">Select a plan, then continue to secure checkout.</p></div>
          <div className="included-grid mt-10 grid gap-4 md:grid-cols-3">{plans.map((item)=><button type="button" key={item.id} onClick={()=>setPlan(item.id)} className={`included-card plan-card flex flex-col gap-3 rounded-xl p-5 text-left ${plan===item.id?'selected':''}`}><span className="plan-term">{item.term}</span><strong className="plan-name">{item.name}</strong><span className="plan-price">{item.price}</span><span className="text-sm leading-6">{item.detail}</span>{plan===item.id&&<span className="plan-selected">Selected</span>}</button>)}</div>
          <form className="checkout-form mx-auto mt-8 max-w-3xl rounded-2xl p-6 md:p-8" onSubmit={startCheckout}><h3 className="text-2xl font-black">Continue to checkout</h3><p className="mt-2 mb-6">We will send your license details to this email.</p><div className="form-grid"><label>Your name<input required autoComplete="name" value={checkout.name} onChange={(event)=>setCheckout({...checkout,name:event.target.value})} placeholder="Name"/></label><label>Email address<input required type="email" autoComplete="email" value={checkout.email} onChange={(event)=>setCheckout({...checkout,email:event.target.value})} placeholder="you@example.com"/></label></div><button className="purchase-button mt-6 w-full rounded-lg px-7 py-5 font-extrabold" type="submit" disabled={paymentState.busy}>{paymentState.busy?'Opening checkout...':`Continue with ${plans.find((item)=>item.id===plan)?.name}`}</button>{paymentState.message&&<p role="alert" className={`form-message ${paymentState.error?'error':'success'}`}>{paymentState.message}</p>}<p className="secure-note mt-3 text-xs">Your payment details are entered on the secure checkout page.</p></form>
        </div>
      </section>

      <section id="manage-subscription" className="offer-section px-5 py-14 md:px-8">
        <div className="mx-auto max-w-3xl">
          <form className="checkout-form rounded-2xl p-6 md:p-8" onSubmit={cancelSubscription}>
            <h2 className="text-2xl font-black">Cancel monthly subscription</h2>
            <p className="mt-2 mb-6">Enter the license key and purchase email. Cancellation takes effect at the end of the current billing period, and you can use your license until then.</p>
            <div className="form-grid">
              <label>License key<input required autoComplete="off" value={cancellation.licenseKey} onChange={(event) => setCancellation({ ...cancellation, licenseKey: event.target.value })} placeholder="SYN-XXXX-XXXX-XXXX" /></label>
              <label>Purchase email<input required type="email" autoComplete="email" value={cancellation.email} onChange={(event) => setCancellation({ ...cancellation, email: event.target.value })} placeholder="you@example.com" /></label>
            </div>
            <button className="purchase-button mt-6 w-full rounded-lg px-7 py-5 font-extrabold" type="submit" disabled={cancellationState.busy}>{cancellationState.busy ? 'Requesting cancellation...' : 'Cancel subscription'}</button>
            {cancellationState.message && <p role="status" className={`form-message ${cancellationState.error ? 'error' : 'success'}`}>{cancellationState.message}</p>}
          </form>
        </div>
      </section>

      <section id="features" className="features-section px-5 py-14 md:px-8"><div className="mx-auto max-w-6xl"><div className="section-heading"><h2 className="section-title">Synesis Features</h2></div><ul className="features-list"><li>Expert Advisor for MetaTrader 5</li><li>Monthly license with a 7-day trial</li><li>Six-month license with a one-time payment</li><li>Lifetime license with a one-time payment</li><li>Checkout hosted by Bachs</li><li>License generated after successful payment</li><li>License key sent to your email</li><li>Ongoing product updates</li></ul></div></section>

      <section id="guides" className="steps-section px-5 py-14 md:px-8"><div className="mx-auto max-w-6xl"><div className="section-heading"><h2 className="section-title">How to Get Synesis</h2></div><div className="how-it-works"><p>Choose a license and complete checkout using your name and email. After the payment is confirmed, Synesis creates your license and emails the key to you.</p><ol><li>Select a Synesis license plan.</li><li>Enter your name and email address.</li><li>Continue to the secure Bachs checkout.</li><li>Complete payment with an available payment method.</li><li>Check your inbox for your Synesis license key.</li></ol></div></div></section>

      <section id="reviews" className="story-section reviews-section px-5 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="section-kicker">Customer feedback</p>
            <h2 className="section-title mt-3">Reviews</h2>
            <p className="mx-auto mt-4 leading-7">Customer reviews will appear here.</p>
          </div>
          <div className="reviews-grid mt-10">
            {reviewPlaceholders.map((number) => (
              <article className="review-card" key={number}>
                <p className="review-placeholder">Add a real customer review here.</p>
                <p className="review-author">Customer name</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="faq-section px-5 py-20 md:px-8"><div className="mx-auto max-w-3xl"><div className="text-center"><p className="section-kicker">Help</p><h2 className="section-title mt-3">Frequently asked questions</h2><p className="mt-4">Need help? <a href="mailto:support@synesisbot.com">Email Synesis support</a>.</p></div><div className="mt-10 space-y-3">{questions.map(([question,answer],index)=><article className="faq-item" key={question}><button type="button" aria-expanded={openQuestion===index} onClick={()=>setOpenQuestion(openQuestion===index?-1:index)} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left font-bold">{question}<span className="faq-toggle" aria-hidden="true">{openQuestion===index?'−':'+'}</span></button>{openQuestion===index&&<p className="px-5 pb-5 leading-7">{answer}</p>}</article>)}</div></div></section>

      <section id="contact" className="contact-section px-5 py-14 text-center md:px-8"><p className="section-kicker">Contact</p><h2 className="section-title mt-3">Questions about Synesis?</h2><p className="mt-4">Email <a href="mailto:support@synesisbot.com">support@synesisbot.com</a>.</p></section>

      <footer className="site-footer px-5 py-8 md:px-8"><div className="mx-auto max-w-6xl text-center"><div className="footer-brand"><img src="/logo.png" alt="Synesis" /></div><p className="disclaimer mt-4 text-sm">Trading results vary. Past performance does not guarantee future results. Trading involves risk.</p><p className="mt-3 text-xs">(c) {new Date().getFullYear()} Synesis</p></div></footer>
    </main>
  )
}

export default App
