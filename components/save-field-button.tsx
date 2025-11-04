"use client"

import { useState } from "react"
import { Save, Check, AlertCircle } from "lucide-react"

interface SaveFieldButtonProps {
  component: string
  field: string
  value: unknown
  onSave?: () => void
  className?: string
}

export function SaveFieldButton({ 
  component, 
  field, 
  value, 
  onSave,
  className = ""
}: SaveFieldButtonProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  
  const handleSave = async () => {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('파일 저장은 개발 모드에서만 가능합니다')
      return
    }
    
    setIsSaving(true)
    setSaveStatus('saving')
    
    try {
      const response = await fetch('/api/update-field', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          component,
          field,
          value
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSaveStatus('success')
        console.log(`✅ ${component}.tsx의 ${field} 필드가 저장되었습니다`)
        onSave?.()
        
        setTimeout(() => {
          setSaveStatus('idle')
        }, 2000)
      } else {
        setSaveStatus('error')
        console.error('필드 저장 실패:', result.error)
        
        setTimeout(() => {
          setSaveStatus('idle')
        }, 3000)
      }
    } catch (error) {
      console.error('필드 저장 중 오류:', error)
      setSaveStatus('error')
      
      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
    }
    
    setIsSaving(false)
  }
  
  const getIcon = () => {
    switch (saveStatus) {
      case 'success':
        return <Check className="h-4 w-4" />
      case 'error':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Save className="h-4 w-4" />
    }
  }
  
  const getColor = () => {
    switch (saveStatus) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700'
      case 'error':
        return 'bg-red-600 hover:bg-red-700'
      default:
        return 'bg-blue-600 hover:bg-blue-700'
    }
  }
  
  return (
    <button
      onClick={handleSave}
      disabled={isSaving}
      className={`
        p-2 rounded-lg text-white transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${getColor()}
        ${className}
      `}
      title={`${field} 필드를 파일에 저장`}
    >
      {getIcon()}
    </button>
  )
}