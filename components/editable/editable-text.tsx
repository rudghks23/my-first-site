"use client"

import { useState, useEffect, useRef } from 'react'
import { useInlineEditor } from '@/contexts/inline-editor-context'
import { Check, X, Edit2 } from 'lucide-react'

interface EditableTextProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  multiline?: boolean
  storageKey?: string
}

export function EditableText({ 
  value, 
  onChange, 
  className = '', 
  placeholder = '텍스트를 입력하세요',
  multiline = false,
  storageKey
}: EditableTextProps) {
  const { isEditMode, saveData, getData } = useInlineEditor()
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)
  const [isHovered, setIsHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // 초기값 로드
  useEffect(() => {
    if (storageKey) {
      const saved = getData(storageKey) as string | null
      if (saved) {
        onChange(saved)
        setTempValue(saved)
      }
    }
  }, [storageKey])

  const handleSave = () => {
    onChange(tempValue)
    if (storageKey) {
      saveData(storageKey, tempValue)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  if (!isEditMode) {
    return <span className={className}>{value || placeholder}</span>
  }

  if (isEditing) {
    return (
      <span className="inline-flex items-center gap-1">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`${className} bg-background border rounded px-1 py-0.5 text-sm`}
            rows={3}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`${className} bg-background border rounded px-1 py-0.5 text-sm min-w-[100px]`}
          />
        )}
        <button
          onClick={handleSave}
          className="p-1 rounded hover:bg-green-500/20 text-green-500 transition-colors"
          title="저장 (Enter)"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 rounded hover:bg-red-500/20 text-red-500 transition-colors"
          title="취소 (Esc)"
        >
          <X className="h-4 w-4" />
        </button>
      </span>
    )
  }

  return (
    <span
      className={`${className} relative group cursor-pointer hover:bg-muted/50 rounded px-1 transition-colors`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsEditing(true)}
    >
      {value || placeholder}
      {isHovered && (
        <Edit2 className="inline-block ml-1 h-3 w-3 text-muted-foreground" />
      )}
    </span>
  )
}