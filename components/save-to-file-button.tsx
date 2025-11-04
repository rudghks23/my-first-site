"use client"

import { useState } from "react"
import { Save, Check } from "lucide-react"
import { useInlineEditor } from "@/contexts/inline-editor-context"

interface SaveToFileButtonProps {
  componentName: string
  sectionName?: string
  data: unknown
  onSaveSuccess?: () => void
  className?: string
  buttonText?: string
}

export function SaveToFileButton({ 
  componentName, 
  sectionName = 'Info',
  data, 
  onSaveSuccess,
  className = "",
  buttonText = "파일에 저장"
}: SaveToFileButtonProps) {
  const { saveToFile } = useInlineEditor()
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      const success = await saveToFile(componentName, sectionName, data)
      
      if (success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        
        if (onSaveSuccess) {
          onSaveSuccess()
        }
      } else {
        alert('❌ 파일 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('저장 오류:', error)
      alert('❌ 파일 저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }
  
  return (
    <button
      onClick={handleSave}
      disabled={isSaving || saved}
      className={`flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 ${className}`}
    >
      {saved ? (
        <>
          <Check className="h-4 w-4" />
          저장됨
        </>
      ) : (
        <>
          <Save className="h-4 w-4" />
          {isSaving ? '저장 중...' : buttonText}
        </>
      )}
    </button>
  )
}