import React, { useState } from 'react';

const faqs = [
  {
    category: 'Ordering & Shipping',
    icon: '📦',
    questions: [
      {
        q: 'How long does delivery take?',
        a: 'Standard delivery takes 3–7 business days across India. We offer same-day delivery in select metro cities. You will receive a tracking link via email and SMS once your order ships.'
      },
      {
        q: 'Is free shipping available?',
        a: 'Yes! Orders over ₹500 qualify for free standard shipping automatically. No promo code required — the discount is applied at checkout.'
      },
      {
        q: 'Can I change or cancel my order after placing it?',
        a: 'Orders in "Pending" or "Confirmed" status can be cancelled directly from your Profile → My Orders → Cancel Order. Once packed or shipped, cancellation is no longer available.'
      },
      {
        q: 'Do you ship to all states in India?',
        a: 'We ship pan-India to all states and union territories. Remote Himalayan and island locations may require 1–3 additional business days.'
      },
      {
        q: 'What packaging do you use?',
        a: 'All plants are packaged in biodegradable plant-safe boxes with moss-padded interiors to protect roots during transit. Pots are bubble-wrapped individually. We use zero plastic packing peanuts.'
      }
    ]
  },
  {
    category: 'Plants & Products',
    icon: '🌿',
    questions: [
      {
        q: 'Are the plants healthy and pest-free when shipped?',
        a: 'Absolutely. Every plant undergoes a quarantine inspection before packaging. We treat all inventory with organic neem-oil sprays and inspect for pests, root rot, and disease before dispatch.'
      },
      {
        q: 'What if my plant arrives damaged or dead?',
        a: 'We offer a 7-day Arrival Guarantee. If your plant arrives dead, severely damaged, or affected by root rot from transit, send us a photo at support@glassnursery.com within 7 days of delivery. We will replace it or refund in full, no questions asked.'
      },
      {
        q: 'Do you sell rare and exotic plant varieties?',
        a: 'Yes! Our Rare Collectors category is restocked monthly with limited-edition varieties like Monstera Albo, Pink Princess Philodendron, Variegated String of Hearts, and other collector-grade specimens.'
      },
      {
        q: 'Are your plants pet-safe?',
        a: 'Each product listing includes a Pet Safety badge. We carry many pet-friendly varieties (Spider Plant, Calathea, Boston Fern). Toxic varieties (Monstera, Peace Lily) are clearly labelled with a warning.'
      },
      {
        q: 'Can I buy plants in bulk for office or events?',
        a: 'Yes! For bulk orders of 10+ plants, contact us at bulk@glassnursery.com for special pricing and coordinated delivery scheduling for events, office fit-outs, or wedding décor.'
      }
    ]
  },
  {
    category: 'Payments & Wallet',
    icon: '💳',
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept Cash on Delivery (COD), UPI (Google Pay, PhonePe, Paytm), Net Banking, all major Credit/Debit cards, and payments from your GLASS Wallet balance.'
      },
      {
        q: 'What is the GLASS Wallet?',
        a: 'The GLASS Wallet is your personal store credit balance. You can top it up via UPI/card and use it for future purchases. Wallet funds never expire and can be partially applied to any order.'
      },
      {
        q: 'How do I use a coupon or promo code?',
        a: 'At the Checkout page, there is a "Coupon Code" field above the Order Summary. Type your code and click "Apply". The discount will be reflected in your order total immediately.'
      },
      {
        q: 'Is my payment information safe?',
        a: 'Yes. We do not store any card or UPI details on our servers. All payment processing is handled through PCI-DSS compliant payment gateways with 256-bit SSL encryption.'
      }
    ]
  },
  {
    category: 'Account & Profile',
    icon: '👤',
    questions: [
      {
        q: 'How do I reset my password?',
        a: 'On the Login page, click "Forgot Password?" and enter your registered email. We will send a 6-digit OTP to your inbox. Enter the OTP and set your new password.'
      },
      {
        q: 'Can I have multiple shipping addresses saved?',
        a: 'Yes! Go to Profile → Shipping Addresses to add unlimited addresses. You can set any address as your Default and switch addresses freely at checkout.'
      },
      {
        q: 'How does the Referral Program work?',
        a: 'Every account has a unique referral code found in Profile → Invite & Referrals. When a friend uses your code during registration, you both earn ₹50 wallet credits automatically.'
      },
      {
        q: 'Can I become a vendor and sell on GLASS?',
        a: 'Yes! Register with the role "Vendor" on the sign-up page. After email verification, you\'ll get access to the Vendor Dashboard where you can list products, manage inventory, and track orders.'
      }
    ]
  },
  {
    category: 'Returns & Refunds',
    icon: '🔄',
    questions: [
      {
        q: 'What is your return policy?',
        a: 'We accept returns within 7 days of delivery for pots, tools, and accessories in unused, original condition. Live plants are not returnable unless they qualify under our 7-day Arrival Guarantee.'
      },
      {
        q: 'How long does a refund take?',
        a: 'Approved refunds are processed within 3–5 business days. Refunds go back to the original payment source, or to your GLASS Wallet if you prefer faster credit (usually within 24 hours).'
      },
      {
        q: 'How do I initiate a return?',
        a: 'Log into your account, go to Profile → My Orders, find the relevant order, and click "Request Return". Fill in the reason and upload a photo if the item is damaged. Our team will review within 24 hours.'
      }
    ]
  }
];

const FAQPage = () => {
  const [openItem, setOpenItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleItem = (key) => setOpenItem(openItem === key ? null : key);

  const filteredFaqs = faqs.map(cat => ({
    ...cat,
    questions: cat.questions.filter(
      q =>
        q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 0', fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: '800', background: 'linear-gradient(135deg, #10b981, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.75rem' }}>
          Frequently Asked Questions
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1.5rem' }}>
          Everything you need to know about GLASS Plant & Nursery Store.
        </p>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: '440px', margin: '0 auto' }}>
          <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1rem' }}>🔍</span>
          <input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.8rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* FAQ Categories */}
      {filteredFaqs.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
          No questions found for "{searchTerm}". Try a different keyword.
        </div>
      ) : (
        filteredFaqs.map(cat => (
          <div key={cat.category} style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.4rem' }}>{cat.icon}</span>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{cat.category}</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {cat.questions.map((item, idx) => {
                const key = `${cat.category}-${idx}`;
                const isOpen = openItem === key;
                return (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--card-bg)',
                      border: `1px solid ${isOpen ? 'rgba(16, 185, 129, 0.4)' : 'var(--card-border)'}`,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      transition: 'border-color 0.2s'
                    }}
                  >
                    <button
                      onClick={() => toggleItem(key)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1.1rem 1.4rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        gap: '1rem'
                      }}
                    >
                      <span>{item.q}</span>
                      <span style={{ fontSize: '1.2rem', color: '#10b981', transition: 'transform 0.2s', transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)', flexShrink: 0 }}>+</span>
                    </button>

                    {isOpen && (
                      <div style={{ padding: '0 1.4rem 1.2rem', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7, borderTop: '1px solid var(--card-border)' }}>
                        <p style={{ margin: '1rem 0 0' }}>{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Contact CTA */}
      <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.08))', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.8rem' }}>💬</div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.4rem' }}>Still have questions?</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
          Our plant care team responds within 2 hours on weekdays.
        </p>
        <a
          href="mailto:support@glassnursery.com"
          style={{ display: 'inline-block', padding: '0.7rem 1.8rem', background: '#10b981', color: 'white', borderRadius: '8px', fontWeight: '700', fontSize: '0.9rem', textDecoration: 'none' }}
        >
          Email Support →
        </a>
      </div>
    </div>
  );
};

export default FAQPage;
