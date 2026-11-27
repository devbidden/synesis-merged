import { useState } from 'react'
import AdminDashboard from './AdminDashboard'
import CancelSubscriptionPage from './CancelSubscriptionPage'
import DownloadEAButton from './DownloadEAButton'
import TelegramFloat from './TelegramFloat'
import './App.css'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const plans = [
  { id: 'BASIC', name: 'Monthly subscription', term: '1 month access', price: '$20', detail: 'Only $20/month. Cancel renewal online.' },
  { id: 'SIX_MONTHS', name: 'Six-month license', term: '6 months access', price: '$100', detail: 'Pay $100 for 6 months Save $20!' },
  { id: 'LIFETIME', name: 'Lifetime license', term: 'Lifetime access', price: '$3000', detail: 'One payment. No recurring billing. Own the EA' },
]

const questions = [
  ['Which Synesis plan fits me?', 'Choose the plan that works best for you. Get started with monthly access at $20/month, or save with a one-time payment of $100 for 6 months. Want lifetime access? Pay once and enjoy Synesis forever for $3,000.'],
  ['When do I get my license key?', 'After your payment is confirmed, we create your license and email the key to the address you used at checkout.'],
  ['Can I stop monthly renewals?', 'Yes. Use the cancellation page with your license key and purchase email. Your license remains active through the current paid billing period.'],
  ['What payment methods are accepted?', 'We securely display the payment methods available to you during checkout.'],
]

const resultImages = Object.entries(import.meta.glob('./assets/results/**/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})).sort(([first], [second]) => first.localeCompare(second, undefined, { numeric: true }))
const resultSections = [{
  id: 'live-accounts',
  title: 'Live MT5 Trade History',
  images: resultImages.filter(([path]) => path.includes('/results/live-accounts/')),
}]
const reviewPlaceholders = [
  {
    quote: 'I used it for almost a month now, its profitable but doesnt trade in daily basis, it looks for the best opportunity. thanks for the support.', author: 'Axel' },
  { quote: 'Excellent EA. I recently purchased SynesisAI, and I’m very impressed with the overall product and its potential. The EA looks well-designed, with great features and a professional approach to automated trading. The purchasing process was smooth, and I’m looking forward to testing it further and seeing its performance in live market conditions. So far, I’m happy with my purchase. I appreciate the work and effort put into developing this EA.', author: 'Singh' },
  { quote: 'I have spent a week, and the live trading and backtesting were pretty much the same. Hopefully, it can stay that way.', author: 'Freddie O.' },
  { quote: 'SB has been running for some time and has generated profits for me. I highly recommend it to everyone. This is the ideal EA I have been searching for. It has excellent risk control logic and minimizes capital risk while SB is running.', author: 'Mvyei' },
  { quote: 'I don’t usually leave reviews, but Synesis deserves one. What I like most is the clear TP/SL structure, the controlled risk and the fact that trades are usually relatively short, so you’re not left worrying about positions for days. If you are looking for a serious EA and not just a quick “big hit” that stops working a week later, I would definitely recommend taking a look at Titan.', author: 'Nilesh' },
  { quote: 'Best TP/SL EA for me, very few and very short trades but high profitability. The results are very close of the live signal. Cant be happier with sometimes 5-10s secondes trades that makes some good money.And cherry on top, the risk management is always very easy, so I sleep very well. Set and forget boys.', author: 'Abdulkareem' },
  { quote: 'I am genuinely impressed with Synesis! The strategy behind this Expert Advisor is top-tier, and its recovery system for drawdowns is outstanding.', author: 'Krikor' },
]


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
          <div className="result-frame result-frame-wide">
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
    throw new Error('Could not reach the Synesis service. Check the backend connection and try again.')
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

  if (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/')) {
    return <AdminDashboard />
  }
  if (window.location.pathname === '/cancel-subscription') return <CancelSubscriptionPage />

  return (
    <main>
      <header className="brand-header">
        <div className="header-inner mx-auto flex max-w-7xl items-center justify-between gap-2 px-3">
          <a className="brand-mark" href="#top" aria-label="Synesis home"><img className="brand-logo" src="/logo.png" alt="Synesis" /></a>
          <nav className="main-nav" aria-label="Main navigation"><a className="nav-order-now" href="#order">Order Now</a><a href="#reviews">Reviews</a><a href="#guides">Guide</a></nav>
        </div>
      </header>

      <section id="top" className="hero-section px-4 py-10 md:px-8">
        <div className="hero-showcase mx-auto max-w-6xl text-center">
          <div className="hero-copy mx-auto max-w-4xl">
            <p className="hero-kicker"> MAKE MONEY WHILE YOU SLEEP WITH AI</p>
            <h1 className="hero-title mt-2 text-3xl font-normal md:text-4xl">Don't Be Left Out. Put Synesis AI to work</h1>
            <p className="hero-subtitle mt-3 text-base">See real MT5 trade history, choose your license, and get started with Synesis. Your next step is one click away.</p>
            <a className="purchase-button cta-bounce mt-5 inline-flex items-center justify-center px-6 py-3 font-bold" href="#order">START NOW! DON'T BE LEFT OUT</a>
            <div className="free-ea-download"><DownloadEAButton /><p>Free EA shell download. A valid Synesis license is required to activate it.</p></div>
            <div className="hero-assurances" aria-label="Synesis plan details"><span>24/7 support</span><span>Secure hosted checkout</span><span>License key by email</span></div>
          </div>
          <div className="hero-product-wrap mt-6"><img className="hero-product-image" src="/logo.png" alt="Synesis Expert Advisor" /></div>
        </div>
      </section>

      <section id="results" className="results-section px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="section-heading"><p className="section-kicker">REAL MT5 ACCOUNT SCREENSHOT</p><h2 className="section-title">See the Trade History for Yourself</h2><p>Many EAs are marketed using impressive backtest results built on curve-fitted data. SynesisAI is different. It shows you real, live trading performance directly from MetaTrader 5, so you can evaluate actual trades, not just optimized historical results.</p></div>
          {resultImages.length > 0
            ? resultSections.filter((section) => section.images.length > 0).map((section) => (
              <div className="result-group" key={section.id}>
                <h3 className="result-heading">{section.title}</h3>
                <div className="results-grid live-results-grid">{section.images.map(([path, src], index) => <ResultSample key={path} src={src} filename={`Live MT5 account result ${index + 1}`} number={index + 1} />)}</div>
              </div>
            ))
            : <p className="results-empty mt-6 text-center">Add screenshots to a folder in <code>client/src/assets/results</code> to display them here.</p>}
          <p className="results-note mt-5 text-center text-sm"></p>
          <div className="marketing-cta-row"><a className="purchase-button" href="#order">CHOOSE YOUR PLAN</a><span>one-month, six-month, and lifetime options.</span></div>
        </div>
      </section>

      <section id="order" className="offer-section px-5 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center"><p className="section-kicker">PICK YOUR ACCESS</p><h2 className="section-title mt-3">Three plans. One clear next step.</h2><p className="mt-4 leading-7">Choose monthly access, six months, or lifetime. See the price before you continue to secure checkout.</p></div>
          <div className="included-grid mt-10 grid gap-4 md:grid-cols-3">{plans.map((item)=><button type="button" key={item.id} onClick={()=>setPlan(item.id)} className={`included-card plan-card flex flex-col gap-3 rounded-xl p-5 text-left ${plan===item.id?'selected':''}`}><span className="plan-term">{item.term}</span><strong className="plan-name">{item.name}</strong><span className="plan-price">{item.price}</span><span className="text-sm leading-6">{item.detail}</span>{plan===item.id&&<span className="plan-selected">Selected</span>}</button>)}</div>
          <form className="checkout-form mx-auto mt-8 max-w-3xl rounded-2xl p-6 md:p-8" onSubmit={startCheckout}><h3 className="text-2xl font-black">Get Your Synesis License Now</h3><p className="mt-2 mb-6">Add your details. Weâ€™ll email your license key after your payment is confirmed.</p><div className="form-grid"><label>Your name<input required autoComplete="name" value={checkout.name} onChange={(event)=>setCheckout({...checkout,name:event.target.value})} placeholder="Name"/></label><label>Email address<input required type="email" autoComplete="email" value={checkout.email} onChange={(event)=>setCheckout({...checkout,email:event.target.value})} placeholder="you@example.com"/></label></div><button className="purchase-button mt-6 w-full rounded-lg px-7 py-5 font-extrabold" type="submit" disabled={paymentState.busy}>{paymentState.busy?'Opening secure checkout...':plan === 'BASIC' ? 'CLAIM MY LICENSE' : 'GET MY LICENSE'}</button>{paymentState.message&&<p role="alert" className={`form-message ${paymentState.error?'error':'success'}`}>{paymentState.message}</p>}<p className="secure-note mt-3 text-xs">Checkout is hosted securely. Monthly renewals can be canceled online.</p></form>
        </div>
      </section>

      <section className="offer-section px-5 py-10 md:px-8"><div className="cancel-site-cta mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 rounded-xl p-5"><div><strong>Already on the monthly plan?</strong><p>Stop future renewals online with your license key and purchase email.</p></div><a className="purchase-button" href="/cancel-subscription">Manage subscription</a></div></section>

      <section id="features" className="features-section px-5 py-14 md:px-8"><div className="mx-auto max-w-6xl"><div className="section-heading"><h2 className="section-title">A Clear, Simple Way to Get Started</h2><p>Everything you need to activate Synesis on MetaTrader 5.</p></div><ul className="features-list"><li>Expert Advisor built for MetaTrader 5</li><li>One month access for just $20</li><li>Six-month access for a one-time $100 payment</li><li>Lifetime access for a one-time $3,000 payment</li><li>Secure checkout hosted</li><li>License created after payment confirmation</li><li>License key delivered by email</li><li>Ongoing product updates</li></ul><div className="marketing-cta-row"><a className="purchase-button" href="#order">DON'T BE LEFT OUT</a></div></div></section>

      <section id="guides" className="steps-section px-5 py-14 md:px-8"><div className="mx-auto max-w-6xl"><div className="section-heading"><h2 className="section-title">From Plan to MT5: 5 Simple Steps</h2></div><div className="how-it-works"><p>Get set up with a short, straightforward checkout and license activation process. WATCH THE VIDEO GUIDE BELOW</p><ol><li>Pick monthly, six-month, or lifetime access.</li><li>Enter the name and email for your license.</li><li>Complete checkout securely.</li><li>Receive your license key by email after payment confirmation.</li><li>Activate your license in MetaTrader 5 and configure Synesis.</li></ol></div><div className="setup-video-wrap"><video className="setup-video" controls preload="metadata" playsInline aria-label="Synesis setup guide video"><source src="/video.mp4" type="video/mp4" />Your browser does not support embedded videos.</video></div><div className="marketing-cta-row"><a className="purchase-button" href="#order">START NOW</a></div></div></section>

      <section id="reviews" className="story-section reviews-section px-5 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="section-kicker">FROM THE COMMUNITY</p>
            <h2 className="section-title mt-3">Customer Reviews</h2>
            <p className="mx-auto mt-4 leading-7"></p>
          </div>
          <div className="reviews-carousel-controls" aria-label="Review carousel controls">
            <button type="button" aria-label="Scroll reviews left" onClick={() => document.querySelector('.reviews-grid')?.scrollBy({ left: -380, behavior: 'smooth' })}>â†</button>
            <button type="button" aria-label="Scroll reviews right" onClick={() => document.querySelector('.reviews-grid')?.scrollBy({ left: 380, behavior: 'smooth' })}>â†’</button>
          </div>
          <div className="reviews-grid mt-3" role="region" aria-label="Customer reviews" tabIndex="0">
            {reviewPlaceholders.map(({ quote, author }) => (
              <article className="review-card" key={author}>
                <p className="review-placeholder">{quote}</p>
                <p className="review-author">{author} <span></span></p>
              </article>
            ))}
          </div>
          <div className="marketing-cta-row"><a className="purchase-button" href="#order">READY TO START? ORDER NOW</a></div>
        </div>
      </section>

      <section id="faq" className="faq-section px-5 py-20 md:px-8"><div className="mx-auto max-w-3xl"><div className="text-center"><p className="section-kicker">Help</p><h2 className="section-title mt-3">Frequently asked questions</h2><p className="mt-4">Need help? <a href="mailto:support@synesisbot.com">24/7 support</a>.</p></div><div className="mt-10 space-y-3">{questions.map(([question,answer],index)=><article className="faq-item" key={question}><button type="button" aria-expanded={openQuestion===index} onClick={()=>setOpenQuestion(openQuestion===index?-1:index)} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left font-bold">{question}<span className="faq-toggle" aria-hidden="true">{openQuestion===index?'-':'+'}</span></button>{openQuestion===index&&<p className="px-5 pb-5 leading-7">{answer}</p>}</article>)}</div></div></section>

      <section id="contact" className="contact-section px-5 py-14 text-center md:px-8"><p className="section-kicker">Contact</p><h2 className="section-title mt-3">Questions about Synesis?</h2><p className="mt-4">Email <a href="mailto:support@synesisbot.com">support@synesisbot.com</a>.</p><a className="purchase-button inline-flex mt-6" href="#order">START NOW</a></section>

      <footer className="site-footer px-5 py-8 md:px-8"><div className="mx-auto max-w-6xl text-center"><div className="footer-brand"><img src="/logo.png" alt="Synesis" /></div><p className="disclaimer mt-4 text-sm">Trading results vary. Past performance does not guarantee future results. Trading involves risk.</p><p className="mt-3 text-xs">(c) {new Date().getFullYear()} Synesis</p></div></footer>
      <TelegramFloat />
    </main>
  )
}

export default App

