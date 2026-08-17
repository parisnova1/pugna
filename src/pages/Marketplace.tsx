import { useState } from 'react'

const RED = '#e5172b'
const CARD = '#0f0f0f'
const BORDER = '#1c1c1c'
const MUTED = '#888888'
const DISPLAY = "'Barlow Condensed', sans-serif"

const CATEGORIES = ['All', 'Boxing Gloves', 'Hand Wraps', 'Headgear', 'Shoes', 'Apparel', 'Training Equipment', 'Club Merchandise']

const PRODUCTS = [
  { name: 'Pro Training Gloves', brand: 'Rival', price: 179, category: 'Boxing Gloves', rating: 5, reviews: 48, img: 'https://images.unsplash.com/photo-1620123449946-30d6efd4b8ba?w=400&h=400&fit=crop&auto=format' },
  { name: 'Head Guard Pro', brand: 'Fairtex', price: 89, category: 'Headgear', rating: 4, reviews: 31, img: 'https://images.unsplash.com/photo-1607702713064-0143212236ae?w=400&h=400&fit=crop&auto=format' },
  { name: 'Fight Shorts', brand: 'Venum', price: 59, category: 'Apparel', rating: 5, reviews: 87, img: 'https://images.unsplash.com/photo-1602827113876-839bcf3ccb3a?w=400&h=400&fit=crop&auto=format' },
  { name: 'Hand Wraps 4.5m', brand: 'Everlast', price: 14, category: 'Hand Wraps', rating: 4, reviews: 124, img: 'https://images.unsplash.com/photo-1546711076-85a7923432ab?w=400&h=400&fit=crop&auto=format' },
  { name: 'Speed Bag Platform', brand: 'Title', price: 129, category: 'Training Equipment', rating: 4, reviews: 19, img: 'https://images.unsplash.com/photo-1509563268479-0f004cf3f58b?w=400&h=400&fit=crop&auto=format' },
  { name: 'Boxing Shoes Lite', brand: 'Adidas', price: 149, category: 'Shoes', rating: 5, reviews: 62, img: 'https://images.unsplash.com/photo-1495555687398-3f50d6e79e1e?w=400&h=400&fit=crop&auto=format' },
  { name: 'Club Hoodie', brand: 'Pugna', price: 69, category: 'Club Merchandise', rating: 5, reviews: 14, img: 'https://images.unsplash.com/photo-1575747515871-2e323827539e?w=400&h=400&fit=crop&auto=format' },
  { name: 'Sparring Gloves 16oz', brand: 'Cleto Reyes', price: 219, category: 'Boxing Gloves', rating: 5, reviews: 37, img: 'https://images.unsplash.com/photo-1564097147829-44f8c74a8549?w=400&h=400&fit=crop&auto=format' },
]

export default function Marketplace() {
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured')
  const [maxPrice, setMaxPrice] = useState(300)

  let filtered = category === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.category === category)
  filtered = filtered.filter(p => p.price <= maxPrice)
  if (sort === 'price-asc') filtered = [...filtered].sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') filtered = [...filtered].sort((a, b) => b.price - a.price)
  if (sort === 'rating') filtered = [...filtered].sort((a, b) => b.rating - a.rating)

  return (
    <div>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#080808', padding: '48px 0 0' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '24px', height: '2px', backgroundColor: RED }} />
            <span style={{ fontFamily: DISPLAY, fontSize: '11px', fontWeight: 600, letterSpacing: '0.25em', color: RED, textTransform: 'uppercase' }}>Marketplace</span>
          </div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 'clamp(40px, 6vw, 80px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.9, marginBottom: '32px' }}>
            PUGNA <span style={{ color: RED }}>MARKETPLACE</span>
          </h1>

          {/* Category tabs */}
          <div style={{ display: 'flex', gap: '0', overflowX: 'auto' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                style={{
                  fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '14px 20px', color: category === cat ? '#fff' : MUTED, whiteSpace: 'nowrap',
                  borderBottom: category === cat ? `2px solid ${RED}` : '2px solid transparent', transition: 'color 0.15s',
                }}
                onMouseEnter={e => { if (category !== cat) (e.currentTarget.style.color = '#ddd') }}
                onMouseLeave={e => { if (category !== cat) (e.currentTarget.style.color = MUTED) }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '40px 32px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: '40px', alignItems: 'start' }}>
        {/* Sidebar filters */}
        <aside style={{ position: 'sticky', top: '80px' }}>
          <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase' }}>Filters</div>
            </div>

            <div style={{ padding: '20px' }}>
              {/* Sort */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: '12px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', marginBottom: '10px' }}>Sort By</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {([['featured', 'Featured'], ['price-asc', 'Price: Low–High'], ['price-desc', 'Price: High–Low'], ['rating', 'Top Rated']] as const).map(([val, label]) => (
                    <button key={val} onClick={() => setSort(val)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', textAlign: 'left' }}
                    >
                      <div style={{ width: '14px', height: '14px', border: `1px solid ${sort === val ? RED : BORDER}`, backgroundColor: sort === val ? RED : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {sort === val && <div style={{ width: '6px', height: '6px', backgroundColor: '#fff' }} />}
                      </div>
                      <span style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: sort === val ? '#fff' : MUTED }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '20px', marginBottom: '24px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: '12px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', marginBottom: '10px' }}>
                  Max Price: <span style={{ color: '#fff' }}>€{maxPrice}</span>
                </div>
                <input type="range" min={10} max={300} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)}
                  style={{ width: '100%', accentColor: RED, cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontFamily: DISPLAY, fontSize: '11px', color: MUTED }}>€10</span>
                  <span style={{ fontFamily: DISPLAY, fontSize: '11px', color: MUTED }}>€300</span>
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: '12px', letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', marginBottom: '10px' }}>Brand</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {['Rival', 'Fairtex', 'Venum', 'Everlast', 'Cleto Reyes', 'Adidas', 'Title'].map(brand => (
                    <label key={brand} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input type="checkbox" style={{ accentColor: RED }} />
                      <span style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: MUTED }}>{brand}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Featured seller */}
          <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, marginTop: '2px' }}>
            <div style={{ padding: '12px 20px', borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.2em', color: RED, textTransform: 'uppercase' }}>Featured Brand</div>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>RIVAL BOXING</div>
              <div style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                12 Products · 4.8★ avg
              </div>
              <button
                onClick={() => setCategory('Boxing Gloves')}
                style={{ width: '100%', backgroundColor: 'transparent', color: '#fff', fontFamily: DISPLAY, fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px', border: `1px solid ${BORDER}`, transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
              >
                View Brand Store
              </button>
            </div>
          </div>
        </aside>

        {/* Product grid */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: '14px', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {filtered.length} Products
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ fontFamily: DISPLAY, fontSize: '18px', color: MUTED, textTransform: 'uppercase', padding: '48px 0' }}>
              No products match your filters.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1px', backgroundColor: BORDER }}>
              {filtered.map((p, i) => (
                <ProductCard key={i} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProductCard({ product: p }: { product: typeof PRODUCTS[0] }) {
  const [hover, setHover] = useState(false)

  return (
    <div
      style={{ backgroundColor: hover ? '#141414' : CARD, overflow: 'hidden', cursor: 'pointer', transition: 'background-color 0.15s' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ position: 'relative', height: '220px', backgroundColor: '#0a0a0a', overflow: 'hidden' }}>
        <img src={p.img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(20%)', transform: hover ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.4s' }} />
        {p.reviews > 50 && (
          <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: RED, fontFamily: DISPLAY, fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', color: '#fff', padding: '3px 8px', textTransform: 'uppercase' }}>
            Bestseller
          </div>
        )}
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase', marginBottom: '4px' }}>{p.brand} · {p.category}</div>
        <div style={{ fontFamily: DISPLAY, fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1.1, marginBottom: '10px' }}>{p.name}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontFamily: DISPLAY, fontSize: '24px', fontWeight: 900 }}>€{p.price}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map(s => (
                <div key={s} style={{ width: '8px', height: '8px', backgroundColor: s <= p.rating ? RED : '#2a2a2a', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
              ))}
            </div>
            <span style={{ fontFamily: DISPLAY, fontSize: '11px', color: MUTED }}>({p.reviews})</span>
          </div>
        </div>
        <button
          style={{ width: '100%', backgroundColor: hover ? RED : 'transparent', color: '#fff', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px', border: `1px solid ${hover ? RED : BORDER}`, transition: 'all 0.2s' }}
        >
          {hover ? 'Add to Cart' : 'View Product'}
        </button>
      </div>
    </div>
  )
}
