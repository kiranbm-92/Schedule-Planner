import React, { useState, useEffect } from 'react'
import { User, Agency, Unit, Queue, Team } from '@/types'
import { supabase } from '@/services/supabase'
import { Plus, Edit, Trash2, Search, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

const AgentMaster: React.FC = () => {
  const [agents, setAgents] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAgent, setEditingAgent] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [queues, setQueues] = useState<Queue[]>([])

  const [formData, setFormData] = useState<Partial<User>>({
    employee_id: '',
    name: '',
    email: '',
    role: 'agent',
    active: true,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [agentsRes, agenciesRes, unitsRes, queuesRes] = await Promise.all([
        supabase.from('users').select('*').eq('role', 'agent'),
        supabase.from('agencies').select('*'),
        supabase.from('units').select('*'),
        supabase.from('queues').select('*'),
      ])

      if (agentsRes.error) throw agentsRes.error
      if (agenciesRes.error) throw agenciesRes.error
      if (unitsRes.error) throw unitsRes.error
      if (queuesRes.error) throw queuesRes.error

      setAgents(agentsRes.data || [])
      setAgencies(agenciesRes.data || [])
      setUnits(unitsRes.data || [])
      setQueues(queuesRes.data || [])
    } catch (error: any) {
      toast.error('Failed to load agents')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAgent = async () => {
    if (!formData.employee_id || !formData.name || !formData.email) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      if (editingAgent) {
        // Update existing agent
        const { error } = await supabase
          .from('users')
          .update(formData)
          .eq('id', editingAgent.id)

        if (error) throw error
        toast.success('Agent updated successfully')
      } else {
        // Create new agent via function call
        // Note: This would require a backend function to create auth user
        toast.success('Agent creation requires admin setup')
      }

      setShowForm(false)
      setEditingAgent(null)
      setFormData({ employee_id: '', name: '', email: '', role: 'agent', active: true })
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save agent')
    }
  }

  const handleDelete = async (agentId: string) => {
    if (!window.confirm('Are you sure you want to delete this agent?')) return

    try {
      const { error } = await supabase.from('users').delete().eq('id', agentId)
      if (error) throw error
      toast.success('Agent deleted successfully')
      fetchData()
    } catch (error: any) {
      toast.error('Failed to delete agent')
    }
  }

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h1 className="text-2xl font-bold text-gray-900">Agent Master</h1>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingAgent(null)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Agent
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Agent Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Employee ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAgents.map((agent) => (
              <tr key={agent.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-sm font-mono text-gray-900">{agent.employee_id}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{agent.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{agent.email}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      agent.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {agent.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingAgent(agent)
                      setFormData(agent)
                      setShowForm(true)
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(agent.id)}
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
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-900">
              {editingAgent ? 'Edit Agent' : 'Add New Agent'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID *
                </label>
                <input
                  type="text"
                  value={formData.employee_id || ''}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  placeholder="AGT000123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Agent Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="agent@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.active ? 'active' : 'inactive'}
                  onChange={(e) => setFormData({ ...formData, active: e.target.value === 'active' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingAgent(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAgent}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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

export default AgentMaster
