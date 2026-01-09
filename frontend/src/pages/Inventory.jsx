import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import inventoryService from '../services/inventoryService'
import './Inventory.css'

function Inventory() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  
  // Redirect non-admin to catalog
  if (!isAdmin()) {
    return <Navigate to="/catalog" replace />
  }
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    quantity: 0,
    unit: 'kg',
    price: 0,
    minStock: 0,
    supplier: ''
  })

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
      setError('Gagal memuat data inventory. Pastikan Inventory Service berjalan.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      let result
      if (editItem) {
        result = await inventoryService.update(editItem.id, formData)
        if (result.success) {
          toast.success(`Bahan "${formData.name}" berhasil diupdate!`)
        }
      } else {
        result = await inventoryService.create(formData)
        if (result.success) {
          toast.success(`Bahan "${formData.name}" berhasil ditambahkan!`)
        }
      }
      
      if (result.success) {
        setShowModal(false)
        resetForm()
        fetchInventories()
      } else {
        toast.error(result.message)
      }
    } catch (err) {
      toast.error('Gagal menyimpan data')
    }
  }

  const handleEdit = (item) => {
    setEditItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      minStock: item.minStock || 0,
      supplier: item.supplier || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (item) => {
    if (confirm(`Yakin ingin menghapus "${item.name}"?`)) {
      try {
        const result = await inventoryService.delete(item.id)
        if (result.success) {
          toast.success(`Bahan "${item.name}" berhasil dihapus!`)
          fetchInventories()
        } else {
          toast.error(result.message)
        }
      } catch (err) {
        toast.error('Gagal menghapus item')
      }
    }
  }

  const handleStockChange = async (item, change) => {
    try {
      const result = await inventoryService.updateStock(item.id, change)
      if (result.success) {
        const action = change > 0 ? 'ditambah' : 'dikurangi'
        toast.success(`Stok "${item.name}" berhasil ${action}!`)
        fetchInventories()
      } else {
        toast.error(result.message)
      }
    } catch (err) {
      toast.error('Gagal update stok')
    }
  }

  const resetForm = () => {
    setEditItem(null)
    setFormData({
      name: '',
      description: '',
      category: '',
      quantity: 0,
      unit: 'kg',
      price: 0,
      minStock: 0,
      supplier: ''
    })
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
    <div className="inventory">
      <div className="inventory-header">
        <h1>📦 Manajemen Inventory Bahan Kue</h1>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true) }}>
          + Tambah Bahan Baru
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

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
        <div className="loading">Memuat inventory...</div>
      ) : (
        <div className="inventory-grid">
          {items.length === 0 ? (
            <div className="empty-state">Tidak ada bahan ditemukan</div>
          ) : (
            items.map((item) => (
              <div key={item.id} className={`inventory-card ${item.quantity <= item.minStock ? 'low-stock' : ''}`}>
                <div className="card-header">
                  <h3>{item.name}</h3>
                  {item.category && <span className="category-badge">{item.category}</span>}
                </div>
                
                {item.description && <p className="description">{item.description}</p>}
                
                <div className="stock-section">
                  <div className="stock-display">
                    <span className="stock-value">{item.quantity}</span>
                    <span className="stock-unit">{item.unit}</span>
                  </div>
                  {item.quantity <= item.minStock && (
                    <span className="low-stock-badge">⚠️ Stok Rendah</span>
                  )}
                </div>

                <div className="stock-controls">
                  <button onClick={() => handleStockChange(item, -1)} className="btn-stock">-</button>
                  <button onClick={() => handleStockChange(item, 1)} className="btn-stock">+</button>
                  <button onClick={() => handleStockChange(item, 10)} className="btn-stock">+10</button>
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

                <div className="card-actions">
                  <button className="btn-edit" onClick={() => handleEdit(item)}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDelete(item)}>Hapus</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editItem ? 'Edit Bahan' : 'Tambah Bahan Baru'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nama Bahan *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Kategori</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="Tepung, Pemanis, dll"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Jumlah Stok</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})}
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label>Satuan</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  >
                    <option value="kg">kg</option>
                    <option value="gram">gram</option>
                    <option value="liter">liter</option>
                    <option value="pcs">pcs</option>
                    <option value="pack">pack</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Harga per Satuan *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Stok Minimum</label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({...formData, minStock: parseFloat(e.target.value) || 0})}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Supplier</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  {editItem ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventory
