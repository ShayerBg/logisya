// Carga todo lo que el usuario tiene permiso de ver y lo arma con la misma forma del MVP.
// Supabase (RLS) decide qué filas llegan: cada operador ve lo suyo y cada trabajador lo que le corresponde.
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import { hm } from './util'

async function traer(tabla) {
  const { data, error } = await supabase.from(tabla).select('*')
  if (error) throw new Error(`${tabla}: ${error.message}`)
  return data
}

export function useLogis() {
  const [db, setDb] = useState(null)
  const [error, setError] = useState(null)
  const timer = useRef(null)

  const cargar = useCallback(async () => {
    try {
      const [ops, ws, vinc, evs, vacs, posts, convs, asis, rems] = await Promise.all([
        traer('operadores'), traer('v_trabajadores'), traer('operador_trabajador'), traer('eventos'),
        traer('v_vacantes'), traer('postulaciones'), traer('convocatorias'), traer('asistencias'), traer('reemplazos')
      ])
      const OPS = Object.fromEntries(ops.map(o => [o.id, o]))
      const W = Object.fromEntries(ws.map(w => [w.id, { ...w, rating: Number(w.rating) }]))
      const A = Object.fromEntries(asis.map(a => [a.postulacion_id, { ...a, entrada: hm(a.entrada), salida: hm(a.salida) }]))
      const R = Object.fromEntries(rems.map(r => [r.vacante_id, r]))
      const EVENTS = evs.map(e => ({
        ...e,
        vacantes: vacs.filter(v => v.evento_id === e.id)
          .sort((a, b) => a.hora_ini.localeCompare(b.hora_ini))
          .map(v => ({
            ...v,
            ini: hm(v.hora_ini),
            fin: hm(v.hora_fin),
            convocados: convs.filter(c => c.vacante_id === v.id).map(c => c.trabajador_id),
            postulaciones: posts.filter(p => p.vacante_id === v.id).map(p => ({ ...p, asis: A[p.id] || null })),
            reemplazo: R[v.id] || null
          }))
      })).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.nombre.localeCompare(b.nombre))
      setDb({ OPS, W, VINC: vinc, EVENTS })
      setError(null)
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    // Revisa plazos vencidos (fase 1 → fase 2) al abrir y cada minuto
    const revisar = () => supabase.rpc('avanzar_fases').then(({ data }) => { if (data > 0) cargar() })
    revisar().then(cargar)
    const iv = setInterval(revisar, 60000)

    // Tiempo real: cuando alguien cambia algo, se recarga (agrupando cambios seguidos)
    const canal = supabase
      .channel('logisya-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        clearTimeout(timer.current)
        timer.current = setTimeout(cargar, 400)
      })
      .subscribe()

    return () => { clearInterval(iv); clearTimeout(timer.current); supabase.removeChannel(canal) }
  }, [cargar])

  return { db, error, recargar: cargar }
}

// Cupos confirmados de una vacante (viene calculado desde la base de datos)
export const conf = v => v.confirmados ?? v.postulaciones.filter(p => p.estado === 'confirmado').length
