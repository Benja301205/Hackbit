// Genera un código de invitación de 6 caracteres (letras mayúsculas + números)
export function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin I/1/O/0 para evitar confusión
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// Calcula start_date y end_date de la primera ronda
export function calcularFechasRonda(period) {
  const hoy = new Date()

  if (period === 'weekly') {
    // Lunes a domingo de la semana actual
    const dia = hoy.getDay() // 0=dom, 1=lun, ...
    const diffLunes = dia === 0 ? -6 : 1 - dia
    const lunes = new Date(hoy)
    lunes.setDate(hoy.getDate() + diffLunes)

    const domingo = new Date(lunes)
    domingo.setDate(lunes.getDate() + 6)

    return {
      start_date: formatDate(lunes),
      end_date: formatDate(domingo),
    }
  }

  // monthly: día 1 al último día del mes actual
  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)

  return {
    start_date: formatDate(primerDia),
    end_date: formatDate(ultimoDia),
  }
}

// Formatea Date a 'YYYY-MM-DD'
export function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Calcula las fechas de la siguiente ronda después de una end_date dada
export function calcularSiguienteRonda(period, endDateStr) {
  const despues = new Date(endDateStr + 'T00:00:00')
  despues.setDate(despues.getDate() + 1) // día siguiente al fin

  if (period === 'weekly') {
    // Lunes a domingo de esa semana
    const dia = despues.getDay()
    const diffLunes = dia === 0 ? -6 : 1 - dia
    const lunes = new Date(despues)
    lunes.setDate(despues.getDate() + diffLunes)

    const domingo = new Date(lunes)
    domingo.setDate(lunes.getDate() + 6)

    return {
      start_date: formatDate(lunes),
      end_date: formatDate(domingo),
    }
  }

  // monthly
  const primerDia = new Date(despues.getFullYear(), despues.getMonth(), 1)
  const ultimoDia = new Date(despues.getFullYear(), despues.getMonth() + 1, 0)

  return {
    start_date: formatDate(primerDia),
    end_date: formatDate(ultimoDia),
  }
}

// Puntos por nivel
export const PUNTOS_POR_NIVEL = { 1: 30, 2: 20, 3: 10 }
