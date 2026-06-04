import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const blogPosts = [
  {
    id: 1,
    category: 'Care Guides',
    emoji: '🌿',
    date: 'May 30, 2026',
    readTime: '5 min read',
    title: 'The Ultimate Guide to Watering Indoor Plants',
    excerpt: 'Overwatering kills more houseplants than underwatering ever could. Learn the exact technique to keep your indoor garden thriving all year round.',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600&auto=format&fit=crop',
    content: `Water is life — but too much of it is death for most houseplants. The most common mistake new plant parents make is watering on a fixed schedule instead of responding to their plant's actual needs.

**The Finger Test**: Push your finger 2 inches into the soil. If it's dry, water thoroughly. If it feels even slightly moist, wait another day.

**Bottom Watering Method**: Place your pot in a shallow tray filled with water for 20-30 minutes. The roots absorb moisture from below, encouraging deeper root growth and preventing root rot.

**Signs of Overwatering**: Yellowing lower leaves, mushy stems, soggy soil, fungus gnats hovering near the soil.

**Signs of Underwatering**: Crispy brown leaf edges, dry and pulling-away-from-pot soil, drooping despite being in a bright location.

**Golden Rule**: It's always safer to underwater. Most plants can bounce back from underwatering much faster than overwatering.`
  },
  {
    id: 2,
    category: 'Plant Selection',
    emoji: '🏠',
    date: 'May 22, 2026',
    readTime: '7 min read',
    title: 'Top 10 Air-Purifying Plants for Your Home Office',
    excerpt: 'NASA studies confirm certain houseplants can reduce indoor VOC toxins by up to 87%. Here are the best air-cleaning plants for small spaces.',
    image: 'https://images.unsplash.com/photo-1483794344563-d27a8d18014e?q=80&w=600&auto=format&fit=crop',
    content: `Working from home? Your indoor air quality directly affects focus, energy, and health. Certain plants are scientifically proven to filter toxins like benzene, formaldehyde, and trichloroethylene from indoor air.

**Top 5 Air Purifiers for Home Offices:**

1. **Snake Plant (Sansevieria)** – Converts CO₂ to oxygen even at night. Near-zero maintenance. Perfect for forgetful plant parents.

2. **Peace Lily** – Thrives in low light. Removes ammonia and acetone fumes from the air. Blooms white flowers in spring.

3. **Spider Plant** – Extremely adaptable. Removes carbon monoxide and formaldehyde. Kid and pet safe!

4. **English Ivy** – Trailing vine that reduces mould spores and airborne fecal particles by up to 94%. Great for bathrooms.

5. **Rubber Plant (Ficus Elastica)** – Bold, dramatic leaves. High transpiration rate keeps humidity optimal for skin and breathing.

Aim for 1-2 medium-sized plants per 100 sq ft of room for noticeable air quality improvement.`
  },
  {
    id: 3,
    category: 'Pest Control',
    emoji: '🕷️',
    date: 'May 14, 2026',
    readTime: '6 min read',
    title: 'Natural Pest Control: Neem Oil & Companion Planting',
    excerpt: 'Before reaching for chemical pesticides, try these proven organic methods that protect your plants and the environment.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600&auto=format&fit=crop',
    content: `Finding pests on your beloved plants is deeply frustrating. But before reaching for harsh chemicals that harm pollinators and the ecosystem, try these highly effective organic remedies.

**Neem Oil Spray Recipe:**
Mix 2 tsp cold-pressed neem oil + 1 tsp castile soap in 1 litre warm water. Shake well. Spray on both sides of all leaves every 7-10 days for 3 weeks.

**Effective Against**: Spider mites, fungus gnats, aphids, mealybugs, scale insects.

**Companion Planting Tips:**
- Plant **Basil** next to tomatoes to repel aphids and whiteflies naturally.
- **Marigolds** deter nematodes in the soil and aphids above ground.
- **Lavender** near roses reduces aphid infestations dramatically.

**Diatomaceous Earth**: Sprinkle this fine powder on soil surface to kill crawling insects. Harmless to humans and pets.

**Yellow Sticky Traps**: Use near plants to catch fungus gnats and whiteflies before infestations escalate.`
  },
  {
    id: 4,
    category: 'Styling',
    emoji: '✨',
    date: 'May 5, 2026',
    readTime: '4 min read',
    title: 'How to Style a Stunning Plant Shelf (Shelfie) Wall',
    excerpt: 'Transform any blank wall into a living, breathing plant gallery with these simple design principles used by professional interior stylists.',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=600&auto=format&fit=crop',
    content: `A well-styled plant shelf can transform any room from ordinary to extraordinary. Here's how interior designers approach creating lush, Instagram-worthy plant walls.

**The Rule of Odds**: Group plants in sets of 3 or 5, never even numbers. Odd groupings feel more natural and visually balanced.

**Vary Heights**: Use a mix of tall uprights (Snake Plant, Dracaena), trailing vines (Pothos, String of Pearls), and short rosettes (Echeveria, Aloe).

**Texture Contrast**: Pair smooth, glossy leaves (Rubber Plant) with fine, feathery foliage (Fern) and spiky succulents for visual interest.

**Pot Colour Theory:**
- **Terracotta** – Warm, earthy tones. Pairs with Bohemian and Mediterranean decor.
- **White Ceramic** – Clean minimalist look. Best for Scandinavian and modern spaces.
- **Dark Charcoal** – Dramatic contrast. Makes foliage colours pop in industrial lofts.

**Lighting Layers**: Every plant wall needs at least one grow lamp for deep-corner shelves. A Spectrum light keeps plants growing year-round regardless of window access.`
  },
  {
    id: 5,
    category: 'Beginner Tips',
    emoji: '🌱',
    date: 'April 28, 2026',
    readTime: '8 min read',
    title: 'Starting Your First Indoor Garden: A Complete Beginners Guide',
    excerpt: 'Never grown a plant before? This step-by-step guide takes you from buying your first pot to propagating your first cutting in under 30 days.',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600&auto=format&fit=crop',
    content: `Welcome to the world of plants! Indoor gardening is one of the most rewarding hobbies you can start — and it's far easier than most people think.

**Week 1 – Choose the Right Starter Plants**
Begin with these fool-proof varieties: Golden Pothos, Spider Plant, Snake Plant, or ZZ Plant. They survive neglect, low light, and irregular watering.

**Week 2 – Soil & Potting Setup**
Always use well-draining potting mix, never garden soil which compacts and suffocates roots indoors. Ensure every pot has at least one drainage hole.

**Week 3 – Finding the Right Light Spot**
Most indoor plants prefer "bright indirect light" — a few feet from a sunny window, never in direct harsh afternoon sun which scorches leaves.

**Week 4 – Your First Propagation**
Take a 10cm cutting with 2-3 nodes. Remove lower leaves. Place in water or moist perlite. In 2-3 weeks, roots will appear — and you'll have your second plant for free!

**The Most Important Rule**: Observe. Spend 5 minutes a week just looking at your plants. Signs of problems always appear early — catching them immediately makes recovery easy.`
  },
  {
    id: 6,
    category: 'Sustainability',
    emoji: '♻️',
    date: 'April 18, 2026',
    readTime: '5 min read',
    title: 'Zero-Waste Plant Care: Composting & Upcycling for Gardeners',
    excerpt: 'Transform kitchen scraps, old containers, and fallen leaves into powerful, free gardening resources. Sustainable plant care starts here.',
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=600&auto=format&fit=crop',
    content: `Sustainable plant care means working with nature, not against it. Here are practical zero-waste methods that save money and help the planet.

**Kitchen Scrap Composting:**
Vegetable peels, coffee grounds, eggshells, and tea bags all break down into rich compost. Combine with dried leaves and water in a small bin. In 6-8 weeks, you have free, premium fertiliser.

**Upcycled Pots:**
Old mugs, tin cans, wooden crates, and even rain boots make unique, charming plant containers. Drill a drainage hole in the bottom and add gravel before soil.

**Banana Peel Fertilizer:**
Soak banana peels in water for 48 hours. The resulting liquid is rich in potassium and phosphorus — perfect for encouraging flowering and fruiting.

**Coffee Ground Uses:**
- Mix into soil as slow-release nitrogen fertilizer for acid-loving plants like ferns.
- Sprinkle on soil surface to deter slugs and snails.

**Leaf Mould:**
Collect fallen leaves, dampen them, and pile in a corner. In 6 months, they break down into incredibly rich, moisture-retaining mulch for all garden beds.`
  }
];

const BlogPage = () => {
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  if (selected) {
    const post = blogPosts.find(p => p.id === selected);
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 0', fontFamily: "'Outfit', sans-serif" }}>
        <button
          onClick={() => setSelected(null)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: '600', marginBottom: '2rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
        >
          ← Back to Blog
        </button>

        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '20px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
          <img src={post.image} alt={post.title} style={{ width: '100%', height: '320px', objectFit: 'cover' }} />
          <div style={{ padding: '2.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>{post.emoji} {post.category}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{post.date} · {post.readTime}</span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '1.5rem', lineHeight: 1.3 }}>{post.title}</h1>
            <div style={{ color: 'var(--text-muted)', lineHeight: 1.9, fontSize: '0.95rem' }}>
              {post.content.split('\n\n').map((para, i) => (
                <p key={i} style={{ marginBottom: '1.2rem' }}>
                  {para.split('**').map((chunk, j) =>
                    j % 2 === 1 ? <strong key={j} style={{ color: 'var(--text-main)' }}>{chunk}</strong> : chunk
                  )}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 0', fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: '800', background: 'linear-gradient(135deg, #10b981, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.75rem' }}>
          GLASS Plant Journal
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '500px', margin: '0 auto' }}>
          Care guides, styling tips, and green living inspiration from the GLASS team.
        </p>
      </div>

      {/* Featured First Post */}
      <div
        onClick={() => setSelected(1)}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '20px', overflow: 'hidden', marginBottom: '2rem', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: 'var(--shadow-lg)' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'none'}
      >
        <img src={blogPosts[0].image} alt={blogPosts[0].title} style={{ width: '100%', height: '320px', objectFit: 'cover' }} />
        <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', alignSelf: 'flex-start', marginBottom: '1rem' }}>
            {blogPosts[0].emoji} {blogPosts[0].category}
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem', lineHeight: 1.3 }}>{blogPosts[0].title}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>{blogPosts[0].excerpt}</p>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{blogPosts[0].date} · {blogPosts[0].readTime}</span>
        </div>
      </div>

      {/* Grid of remaining posts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {blogPosts.slice(1).map(post => (
          <div
            key={post.id}
            onClick={() => setSelected(post.id)}
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <img src={post.image} alt={post.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>{post.emoji} {post.category}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{post.readTime}</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.6rem', lineHeight: 1.3 }}>{post.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' }}>{post.excerpt}</p>
              <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: '600' }}>Read full article →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogPage;
