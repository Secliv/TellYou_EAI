import { useState, useEffect } from 'react'
import inventoryService from '../services/inventoryService'
import './Catalog.css'

function Catalog() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    fetchInventories()
  }, [searchTerm, categoryFilter])

  const fetchInventories = async () => {
    try {
      setLoading(true)
      setError('')
      const filters = {}
      if (searchTerm) filters.search = searchTerm
      if (categoryFilter) filters.category = categoryFilter
      
      const result = await inventoryService.getAll(filters)
      if (result.success) {
        setItems(result.items || [])
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Gagal memuat katalog bahan.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }


  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))]

  return (
    <div className="catalog">
      <div className="catalog-header">
        <h1>📦 Katalog Bahan Kue</h1>
        <p>Pilih bahan yang ingin dipesan</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="catalog-layout">
        {/* Main Content */}
        <div className="catalog-main">
          {/* Filters */}
          <div className="filters">
            <input
              type="text"
              placeholder="Cari bahan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="loading">Memuat katalog...</div>
          ) : (
            <div className="catalog-grid">
              {items.length === 0 ? (
                <div className="empty-state">Tidak ada bahan ditemukan</div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className={`catalog-card ${item.quantity <= 0 ? 'out-of-stock' : ''}`}>
                    <div className="card-header">
                      <h3>{item.name}</h3>
                      {item.category && <span className="category-badge">{item.category}</span>}
                    </div>
                    
                    {item.description && <p className="description">{item.description}</p>}
                    
                    <div className="stock-info">
                      <span className={`stock ${item.quantity <= item.minStock ? 'low' : ''}`}>
                        Stok: {item.quantity} {item.unit}
                      </span>
                    </div>

                    <div className="price-section">
                      <span className="price">{formatPrice(item.price)}</span>
                      <span className="per-unit">/{item.unit}</span>
                    </div>

                    {item.supplier && (
                      <div className="supplier">
                        <small>Supplier: {item.supplier}</small>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Catalog
