import React, { useState, useEffect } from 'react'
import { supabase } from '@/services/supabase'
import { AuxMaster } from '@/types'
import { Loader } from 'lucide-react'
import toast from 'react-hot-toast'

interface AuxSelectorProps {
  agentId: string
  currentAuxId: string | null
  onAuxChange: (auxId: string) => Promise<void>
  isLoading?: boolean
}

const AuxSelector: React.FC<AuxSelectorProps> = ({
  agentId,
  currentAuxId,
  onAuxChange,
  isLoading = false,
}) => {
  const [auxCodes, setAuxCodes] = useState<AuxMaster[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    fetchAuxCodes()
  }, [])

  const fetchAuxCodes = async () => {
    try {
      setIsFetching(true)
      const { data, error } = await supabase
        .from('aux_master')
        .select('*')
        .eq('active', true)
        .eq('agent_selectable', true)
        .order('code')

      if (error) throw error
      setAuxCodes(data || [])
    } catch (error: any) {
      toast.error('Failed to load AUX codes')
      console.error(error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleAuxChange = async (auxId: string) => {
    if (auxId === currentAuxId) return

    try {
      setIsChanging(true)
      await onAuxChange(auxId)
      toast.success('AUX status changed')
    } catch (error: any) {
      toast.error(error.message || 'Failed to change AUX')
    } finally {
      setIsChanging(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader className="w-5 h-5 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {auxCodes.map((aux) => (
        <button
          key={aux.id}
          onClick={() => handleAuxChange(aux.id)}
          disabled={isLoading || isChanging}
          className={`p-3 rounded-lg font-semibold text-sm transition ${
            currentAuxId === aux.id
              ? 'ring-2 ring-offset-2 ring-gray-900 shadow-lg'
              : 'hover:shadow'
          }`}
          style={{
            backgroundColor: aux.color,
            color: 'white',
            opacity: isLoading || isChanging ? 0.6 : 1,
            cursor: isLoading || isChanging ? 'not-allowed' : 'pointer',
          }}
        >
          {isChanging ? (
            <Loader className="w-4 h-4 animate-spin inline" />
          ) : (
            aux.short_name
          )}
        </button>
      ))}
    </div>
  )
}

export default AuxSelector
