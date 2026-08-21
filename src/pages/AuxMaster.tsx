import React, { useState, useEffect } from 'react'
import { AuxMaster } from '@/types'
import { supabase } from '@/services/supabase'
import { Plus, Edit, Trash2, Search, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

const AuxMasterPage: React.FC = () => {
  const [auxCodes, setAuxCodes] = useState<AuxMaster[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAux, setEditingAux] = useState<AuxMaster | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState<Partial<AuxMaster>>({
    code: '',
    name: '',
    short_name: '',
    description: '',
    color: '#3B82F6',
    default_duration_minutes: 15,
    agent_selectable: true,
    wfm_selectable: true,
    active: true,
  })

  useEffect(() => {
    fetchAuxCodes()
  }, [])

  const fetchAuxCodes = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.from('aux_master').select('*')

      if (error) throw error
      setAuxCodes(data || [])
    } catch (error: any) {
      toast.error('Failed to load AUX codes')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAux = async () => {
    if (!formData.code || !formData.name || !formData.short_name) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      if (editingAux) {
        // Update
        const { error } = await supabase
          .from('aux_master')
          .update(formData)
          .eq('id', editingAux.id)

        if (error) throw error
        toast.success('AUX code updated successfully')
      } else {
        // Create
        const { error } = await supabase.from('aux_master').insert([formData])

        if (error) throw error
        toast.success('AUX code created successfully')
      }

      setShowForm(false)
      setEditingAux(null)
      setFormData({
        code: '',
        name: '',
        short_name: '',
        description: '',
        color: '#3B82F6',
        default_duration_minutes: 15,
        agent_selectable: true,
        wfm_selectable: true,
        active: true,
      })
      fetchAuxCodes()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save AUX code')
    }
  }

  const handleDelete = async (auxId: string) => {
    if (!window.confirm('Are you sure you want to delete this AUX code?')) return

    try {
      const { error } = await supabase.from('aux_master').delete().eq('id', auxId)
      if (error) throw error
      toast.success('AUX code deleted successfully')
      fetchAuxCodes()
    } catch (error: any) {
      toast.error('Failed to delete AUX code')
    }
  }

  const filteredAuxCodes = auxCodes.filter(
    (aux) =>
      aux.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aux.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AUX Master</h1>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingAux(null)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add AUX Code
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by code or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* AUX Codes Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Code</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Short</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Color</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Duration</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Agent</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">WFM</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAuxCodes.map((aux) => (
              <tr key={aux.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-sm font-mono font-bold">{aux.code}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{aux.name}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{aux.short_name}</td>
                <td className="px-4 py-3">
                  <div
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: aux.color }}
                    title={aux.color}
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{aux.default_duration_minutes}m</td>
                <td className="px-4 py-3 text-sm">
                  {aux.agent_selectable ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">✓</span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">✗</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {aux.wfm_selectable ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">✓</span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">✗</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      aux.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {aux.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingAux(aux)
                      setFormData(aux)
                      setShowForm(true)
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(aux.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 max-h-96 overflow-y-auto">
            <h2 className="text-lg font-bold mb-4 text-gray-900">
              {editingAux ? 'Edit AUX Code' : 'Add New AUX Code'}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="BREAK"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Break"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Name *</label>
                <input
                  type="text"
                  value={formData.short_name || ''}
                  onChange={(e) => setFormData({ ...formData, short_name: e.target.value.toUpperCase() })}
                  placeholder="BRK"
                  maxLength={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="color"
                  value={formData.color || '#3B82F6'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 px-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Duration (mins)</label>
                <input
                  type="number"
                  value={formData.default_duration_minutes || 15}
                  onChange={(e) => setFormData({ ...formData, default_duration_minutes: parseInt(e.target.value) })}
                  min="15"
                  step="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.agent_selectable || false}
                  onChange={(e) => setFormData({ ...formData, agent_selectable: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm text-gray-700">Agent Selectable</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.wfm_selectable || false}
                  onChange={(e) => setFormData({ ...formData, wfm_selectable: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm text-gray-700">WFM Selectable</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active || false}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm text-gray-700">Active</label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingAux(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAux}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuxMasterPage
