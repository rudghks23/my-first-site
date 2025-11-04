"use client"

import { useState, useEffect } from 'react'
import { useInlineEditor } from '@/contexts/inline-editor-context'
import { Plus, Trash2, GripVertical } from 'lucide-react'

interface EditableListProps {
  items: string[]
  onChange: (items: string[]) => void
  className?: string
  storageKey?: string
  placeholder?: string
  maxItems?: number
}

export function EditableList({ 
  items, 
  onChange, 
  className = '',
  storageKey,
  placeholder = '새 항목',
  maxItems = 20
}: EditableListProps) {
  const { isEditMode, saveData, getData } = useInlineEditor()
  const [localItems, setLocalItems] = useState(items)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [newItem, setNewItem] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  // 초기값 로드
  useEffect(() => {
    if (storageKey) {
      const saved = getData(storageKey)
      if (saved && Array.isArray(saved)) {
        setLocalItems(saved)
        onChange(saved)
      }
    }
  }, [storageKey])

  const handleSave = (newItems: string[]) => {
    setLocalItems(newItems)
    onChange(newItems)
    if (storageKey) {
      saveData(storageKey, newItems)
    }
  }

  const handleAdd = () => {
    if (newItem.trim() && localItems.length < maxItems) {
      const updated = [...localItems, newItem.trim()]
      handleSave(updated)
      setNewItem('')
    }
  }

  const handleRemove = (index: number) => {
    const updated = localItems.filter((_, i) => i !== index)
    handleSave(updated)
  }

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    setEditValue(localItems[index])
  }

  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      const updated = [...localItems]
      updated[editingIndex] = editValue
      handleSave(updated)
      setEditingIndex(null)
      setEditValue('')
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const draggedItem = localItems[draggedIndex]
    const updated = [...localItems]
    updated.splice(draggedIndex, 1)
    updated.splice(index, 0, draggedItem)
    
    setLocalItems(updated)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      handleSave(localItems)
    }
    setDraggedIndex(null)
  }

  if (!isEditMode) {
    return (
      <div className={className}>
        {localItems.map((item, index) => (
          <div key={index} className="mb-2">
            {item}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={className}>
      {localItems.map((item, index) => (
        <div
          key={index}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`flex items-center gap-2 mb-2 p-2 rounded-lg border ${
            draggedIndex === index ? 'opacity-50' : ''
          } hover:bg-muted/50 group`}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
          
          {editingIndex === index ? (
            <div className="flex-1 flex gap-1">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit()
                  if (e.key === 'Escape') setEditingIndex(null)
                }}
                className="flex-1 px-2 py-1 border rounded bg-background"
                autoFocus
              />
              <button
                onClick={handleSaveEdit}
                className="px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
              >
                저장
              </button>
              <button
                onClick={() => setEditingIndex(null)}
                className="px-2 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                취소
              </button>
            </div>
          ) : (
            <>
              <span 
                className="flex-1 cursor-pointer hover:bg-muted rounded px-2 py-1"
                onClick={() => handleEdit(index)}
              >
                {item}
              </span>
              <button
                onClick={() => handleRemove(index)}
                className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/20 rounded transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ))}

      {localItems.length < maxItems && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border rounded-lg bg-background"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            추가
          </button>
        </div>
      )}
    </div>
  )
}