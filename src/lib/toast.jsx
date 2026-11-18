import { createContext, useCallback, useContext, useState } from 'react'

const ToastCtx = createContext(() => {})

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const toast = useCallback(msg => {
    const id = Math.random()
    setItems(xs => [...xs, { id, msg }])
    setTimeout(() => setItems(xs => xs.filter(x => x.id !== id)), 4200)
  }, [])
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map(t => <div key={t.id} className="toast">{t.msg}</div>)}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
