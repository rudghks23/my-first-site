import { useState, useEffect } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  duration?: number
}

interface ToastState {
  toasts: Toast[]
}

let listeners: Array<(state: ToastState) => void> = []
let memoryState: ToastState = { toasts: [] }

function dispatch(action: { type: 'ADD_TOAST' | 'UPDATE_TOAST' | 'REMOVE_TOAST'; toast?: Toast; id?: string }) {
  switch (action.type) {
    case 'ADD_TOAST':
      memoryState = {
        toasts: [...memoryState.toasts, action.toast!],
      }
      break
    case 'UPDATE_TOAST':
      memoryState = {
        toasts: memoryState.toasts.map((t) =>
          t.id === action.id ? { ...t, ...action.toast } : t
        ),
      }
      break
    case 'REMOVE_TOAST':
      memoryState = {
        toasts: memoryState.toasts.filter((t) => t.id !== action.id),
      }
      break
  }
  listeners.forEach((listener) => listener(memoryState))
}

export function useToast() {
  const [state, setState] = useState<ToastState>(memoryState)

  useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    toasts: state.toasts,
    toast: (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9)
      dispatch({ type: 'ADD_TOAST', toast: { ...toast, id } })
      
      if (toast.duration !== Infinity) {
        setTimeout(() => {
          dispatch({ type: 'REMOVE_TOAST', id })
        }, toast.duration || 3000)
      }
    },
    dismiss: (id: string) => dispatch({ type: 'REMOVE_TOAST', id }),
  }
}