import { useState } from 'react'
import './App.css'

const media = {
  hero: 'https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/KrdvLayPETlbpwqSelD0/media/68394b3b927201e72e368104.png',
  product: 'https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/KrdvLayPETlbpwqSelD0/media/68675b859ca6fb759b18efb6.png',
  results: 'https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/KrdvLayPETlbpwqSelD0/media/686b0a2d2271bb2c5ed81076.png',
  story: 'https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/KrdvLayPETlbpwqSelD0/media/6868dc71e4eb731f2d000d58.png',
  bonus: 'https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/KrdvLayPETlbpwqSelD0/media/6869f13a345787599325195b.png',
  guarantee: 'https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/KrdvLayPETlbpwqSelD0/media/8a586a2a-42cb-4765-bc7c-34c7a63219db.png',
  testimonials: [
    'https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/KrdvLayPETlbpwqSelD0/media/683c89239b0aa2bb9208202c.png',
    'https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/KrdvLayPETlbpwqSelD0/media/683c8923178d9b7bbd9020b1.png',
    'https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/KrdvLayPETlbpwqSelD0/media/683c8923dfd9e92617946f23.png',
  ],
}

const steps = [
  {
    number: '01',
    title: 'Set up your Meta Ads Manager',
    text: 'Organise your business manager and ad account the right way, with a guided setup that helps you avoid common early mistakes.',
  },
  {
    number: '02',
    title: 'Launch with contextual ads',
    text: 'Put your offer in front of people already interested in solving the problem you help with—without chasing cold, unqualified leads.',
  },
  {
    number: '03',
    title: 'Retarget and pre-sell',
    text: 'Use low-cost retargeting to build trust, answer objections and keep your business top of mind before a sales conversation.',
  },
]

const inclusions = [
  ['Clients From Ads Course', 'A practical, fast-start video course for launching ads that attract high-ticket clients.'],
  ['Winning Ad Creative System', 'A repeatable process for creating and scaling ads that connect with your audience.'],
  ['$100K Instagram Ads', 'A collection of proven ad examples to learn from instead of starting from a blank page.'],
  ['Meta Ads Launch Checklist', 'A step-by-step checklist to prepare your ads and funnel before launch.'],
  ['Strangers to Client Sales System', 'A simple sales framework to turn new conversations into clients.'],
  ['KPI Tracking Tool', 'See what to measure and where to focus as your campaigns go live.'],
  ['Retargeting Ads Playbook', 'Low-cost strategies to help leads book, show up and make a decision.'],
]

const questions = [
  {
    question: 'What exactly do I get?',
    answer: 'You get instant digital access to the Clients From Ads course, winning creative system, Instagram ad examples, Meta Ads checklist, sales system, KPI tracker and retargeting playbook.',
  },
  {
    question: 'Who is this system for?',
    answer: 'It is designed for coaches, consultants, agencies and online service providers who want a clearer system for getting clients from ads.',
  },
  {
    question: 'Do I need to have run ads before?',
    answer: 'No. The training starts with the foundations and walks you through the setup and launch process step by step.',
  },
  {
    question: 'Is there a money-back guarantee?',
    answer: 'Yes. Your purchase is covered by a 30-day satisfaction guarantee. If the training is not right for you, contact the seller within 30 days to request a refund.',
  },
]

function ProductImage({ className = '' }) {
  return (
    <img
      className={className}
      src={media.product}
      alt="Clients From Ads digital course and included resources"
      loading="lazy"
    />
  )
}

function PurchaseButton({ children = 'GET THE SYSTEM NOW!' }) {
  return (
    <a className="purchase-button inline-flex items-center justify-center gap-2 rounded-lg px-7 py-5 font-extrabold" href="#offer">
      {children} <span aria-hidden="true">➜</span>
    </a>
  )
}

function App() {
  const [openQuestion, setOpenQuestion] = useState(0)

  return (
    <main>
      <header className="brand-header flex items-center justify-center">
        <a className="brand-mark" href="#top" aria-label="Convert Clients home">
          <span className="brand-symbol" aria-hidden="true">C<span>C</span></span>
          <span className="brand-name">CONVERT</span>
          <span className="brand-subtitle">CLIENTS</span>
        </a>
      </header>

      <section id="top" className="hero-section px-5 pb-20 pt-10 text-center md:px-8">
        <div className="hero-copy mx-auto max-w-5xl">
          <p className="eyebrow"><span className="eyebrow-dot" /> FOR ANYONE LOOKING TO GET HIGH-TICKET CLIENTS FROM ADS</p>
          <h1 className="hero-title mt-6 text-4xl font-black uppercase leading-[1.05] md:text-6xl">
            Copy &amp; paste the exact <span className="text-green">“Clients From Ads”</span> system business owners use to get <span className="text-red">3–5 clients per week</span>
          </h1>
          <p className="hero-subtitle mt-5 text-lg font-semibold md:text-2xl">Even if you’ve never run ads before…</p>
          <p className="audience-ribbon mx-auto mt-5 max-w-3xl rounded px-4 py-3 font-bold italic">
            Successfully used with: Coaching, Agency, B2B &amp; B2C offers
          </p>
        </div>

        <div className="hero-showcase mx-auto mt-8 grid max-w-6xl items-center gap-8 lg:grid-cols-[1.4fr_.8fr]">
          <div className="hero-product-wrap">
            <img className="hero-graphic mx-auto w-full max-w-3xl" src={media.hero} alt="Preview of the Clients From Ads system" />
          </div>
          <aside className="hero-offer overflow-hidden rounded-xl">
            <div className="offer-ribbon px-4 py-4 text-sm font-extrabold uppercase tracking-wide">
              Now available for<br /> instant digital download
            </div>
            <div className="offer-card-body px-6 py-5">
              <ProductImage className="offer-product mx-auto" />
              <p className="price-line mt-2 text-3xl font-black">Only <span className="text-green">$5.00</span> today</p>
              <p className="mt-2 text-sm font-semibold">Download the course for just $5. Delivered instantly. Start learning in the next 2 minutes.</p>
              <PurchaseButton />
              <p className="secure-note mt-3 text-xs">🔒 Secure checkout · 30-day money-back guarantee</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="trust-strip px-5 py-5 text-center">
        <p className="font-bold uppercase tracking-[.16em]">A straightforward system for service businesses</p>
        <div className="trust-items mx-auto mt-4 flex max-w-4xl flex-wrap justify-center gap-x-10 gap-y-3 text-sm font-semibold">
          <span>✓ Coach &amp; consultant friendly</span><span>✓ Beginner-friendly setup</span><span>✓ Instant digital access</span>
        </div>
      </section>

      <section className="section-pad intro-section px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2">
          <div>
            <p className="section-kicker">A system, not a magic trick</p>
            <h2 className="section-title mt-3">What is the Clients From Ads system?</h2>
            <p className="mt-5 leading-8">You want a reliable way to reach the right people and turn attention into client conversations. This training brings the moving parts together in a practical, easy-to-follow system.</p>
            <p className="mt-4 leading-8">It is not a promise of overnight results. It is a clear framework to help you build, launch and improve your advertising over time—even if you are starting from scratch.</p>
            <a className="text-link mt-6 inline-flex font-bold" href="#steps">See how the system works <span aria-hidden="true">→</span></a>
          </div>
          <div className="image-frame">
            <ProductImage className="w-full" />
          </div>
        </div>
      </section>

      <section id="steps" className="steps-section px-5 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="section-kicker">Simple by design</p>
            <h2 className="section-title mt-3">A 3-step system to get clients from ads</h2>
            <p className="mt-4 leading-7">Build the foundations, connect with the right audience and follow up consistently.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <article className="step-card rounded-2xl p-7" key={step.number}>
                <span className="step-number">{step.number}</span>
                <h3 className="mt-6 text-xl font-extrabold">{step.title}</h3>
                <p className="mt-3 leading-7">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="outcomes-section px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="section-kicker">Make your next move</p>
            <h2 className="section-title mt-3">A clearer path from ad to client</h2>
            <p className="mt-4 leading-7">Get a framework you can adapt to your own service, audience and goals.</p>
          </div>
          <ul className="outcome-list space-y-4">
            <li><span>✓</span> Build confidence with a step-by-step launch plan</li>
            <li><span>✓</span> Attract more relevant leads for your service</li>
            <li><span>✓</span> Understand what to measure and optimise</li>
            <li><span>✓</span> Stay in front of potential clients with retargeting</li>
          </ul>
        </div>
      </section>

      <section className="proof-section px-5 py-20 md:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="section-kicker">Built from real experience</p>
          <h2 className="section-title mt-3">A system shaped by campaigns and client work</h2>
          <p className="mx-auto mt-4 max-w-3xl leading-7">The training brings together the lessons, process and resources behind the Clients From Ads approach.</p>
          <div className="proof-image mt-10 overflow-hidden rounded-2xl">
            <img src={media.results} alt="Clients From Ads campaign and client results" loading="lazy" />
          </div>
          <div className="proof-quote mt-10">
            <span className="quote-mark" aria-hidden="true">“</span>
            <p className="text-xl font-bold md:text-2xl">“This has genuinely been the most needle-moving period in the history of my business…”</p>
            <p className="mt-3 text-sm font-semibold uppercase tracking-wider">Feedback from a Clients From Ads customer</p>
          </div>
          <div className="testimonial-grid mt-8 grid gap-4 md:grid-cols-3">
            {media.testimonials.map((src, index) => (
              <img key={src} src={src} alt={`Client testimonial ${index + 1}`} loading="lazy" />
            ))}
          </div>
        </div>
      </section>

      <section id="offer" className="offer-section px-5 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="section-kicker">Instant digital download</p>
            <h2 className="section-title mt-3">Everything you need to put the system into action</h2>
            <p className="mt-4 leading-7">Get the complete course and every bonus resource for a one-time payment.</p>
          </div>
          <div className="included-grid mt-12 grid gap-4 md:grid-cols-2">
            {inclusions.map(([title, text], index) => (
              <article className="included-card flex gap-4 rounded-xl p-5" key={title}>
                <span className="included-check" aria-hidden="true">{index === 0 ? '✦' : '✓'}</span>
                <div>
                  <h3 className="font-extrabold">{title}</h3>
                  <p className="mt-2 text-sm leading-6">{text}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="bonus-feature mx-auto mt-10 grid max-w-4xl items-center gap-8 rounded-2xl p-6 md:grid-cols-[.7fr_1fr] md:p-10">
            <img src={media.bonus} alt="A preview of bonus Clients From Ads training" loading="lazy" />
            <div>
              <p className="section-kicker">Included today</p>
              <h3 className="mt-3 text-2xl font-black">Six practical bonuses, included</h3>
              <p className="mt-3 leading-7">From ad creative examples to retargeting guidance, the resources are designed to help you move from setup to action.</p>
              <PurchaseButton />
            </div>
          </div>
        </div>
      </section>

      <section className="story-section px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
          <div className="image-frame">
            <img className="w-full" src={media.story} alt="Clients From Ads customer story" loading="lazy" />
          </div>
          <div>
            <p className="section-kicker">The thinking behind the system</p>
            <h2 className="section-title mt-3">Focus on qualified conversations—not just more leads</h2>
            <p className="mt-5 leading-8">The approach came from moving away from scattered tactics and focusing on the things that support real sales conversations: clear positioning, relevant ads and thoughtful follow-up.</p>
            <p className="mt-4 leading-8">Use the frameworks as a starting point, then tailor the messaging and budget to your own offer and audience.</p>
          </div>
        </div>
      </section>

      <section className="guarantee-section px-5 py-16 md:px-8">
        <div className="guarantee-card mx-auto grid max-w-5xl items-center gap-8 rounded-2xl p-8 md:grid-cols-[.55fr_1fr] md:p-12">
          <img className="guarantee-image mx-auto" src={media.guarantee} alt="30-day money-back guarantee" loading="lazy" />
          <div>
            <p className="section-kicker">Your purchase is protected</p>
            <h2 className="section-title mt-3">Backed by a 30-day money-back guarantee</h2>
            <p className="mt-4 leading-7">Explore the training and apply what you learn. If it is not right for you, contact the seller within 30 days to request a refund. You can learn more about the policy at checkout.</p>
          </div>
        </div>
      </section>

      <section className="faq-section px-5 py-20 md:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="section-kicker">Good to know</p>
            <h2 className="section-title mt-3">Frequently asked questions</h2>
            <p className="mt-4">Still need help? <a href="mailto:support@convertclients.io">Contact our team</a>.</p>
          </div>
          <div className="mt-10 space-y-3">
            {questions.map(({ question, answer }, index) => (
              <article className="faq-item" key={question}>
                <button
                  type="button"
                  aria-expanded={openQuestion === index}
                  onClick={() => setOpenQuestion(openQuestion === index ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left font-bold"
                >
                  {question}<span className="faq-toggle" aria-hidden="true">{openQuestion === index ? '−' : '+'}</span>
                </button>
                {openQuestion === index && <p className="px-5 pb-5 leading-7">{answer}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="final-offer px-5 py-16 text-center md:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="section-kicker">Limited-time introductory offer</p>
          <h2 className="section-title mt-3">Get the Clients From Ads system today</h2>
          <p className="mt-4 leading-7">Instant access to the course, tools and bonuses for just <strong>$5.00</strong>.</p>
          <PurchaseButton>GET INSTANT ACCESS — $5</PurchaseButton>
          <p className="mt-4 text-sm">One-time payment · Digital download · 30-day guarantee</p>
        </div>
      </section>

      <footer className="site-footer px-5 py-12 md:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm leading-6">This site is not a part of Facebook or Facebook Inc. and is not endorsed by Facebook. FACEBOOK is a trademark of Facebook, Inc.</p>
          <div className="footer-rule my-7" />
          <ProductImage className="footer-product mx-auto" />
          <p className="disclaimer mt-7 text-xs leading-6">This product is for educational and informational purposes only. No earnings, client volume or business results are guaranteed. Results depend on your offer, market, budget and implementation. Any examples are illustrative and are not promises of typical results. You are responsible for your decisions and should consult qualified professional advisers where appropriate.</p>
          <p className="mt-5 text-xs">Brought to you by Convert Clients · <a href="https://convertclients.io/terms">Terms</a> · <a href="https://convertclients.io/privacy">Privacy</a></p>
        </div>
      </footer>

      <div className="sticky-offer fixed inset-x-0 bottom-0 z-20 px-4 py-3">
        <div className="sticky-inner mx-auto flex max-w-4xl items-center justify-between gap-4 rounded-xl px-5 py-3">
          <div className="hidden sm:block">
            <p className="text-lg font-black">Only <span className="text-green">$5.00 today</span></p>
            <p className="text-xs">Instant access · 30-day guarantee</p>
          </div>
          <PurchaseButton>GET YOUR SYSTEM NOW!</PurchaseButton>
        </div>
      </div>
    </main>
  )
}

export default App
