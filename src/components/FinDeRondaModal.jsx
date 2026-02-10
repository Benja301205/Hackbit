export default function FinDeRondaModal({ finDeRonda, premio, onCerrar }) {
  if (!finDeRonda) return null

  const { ranking, winnerId, empate, ronda } = finDeRonda

  const ganador = ranking.find((r) => r.user.id === winnerId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <p className="text-5xl mb-3">🏆</p>
            <h2 className="text-xl font-bold">¡Ronda finalizada!</h2>
            <p className="text-sm text-gray-400 mt-1">
              {ronda.start_date} — {ronda.end_date}
            </p>
          </div>

          {/* Ganador o empate */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5 text-center">
            {empate ? (
              <>
                <p className="text-sm text-gray-600 mb-1">Resultado</p>
                <p className="text-lg font-bold text-amber-600">¡Empate!</p>
              </>
            ) : ganador ? (
              <>
                <p className="text-sm text-gray-600 mb-1">Ganador</p>
                <p className="text-lg font-bold text-emerald-700">
                  {ganador.user.nickname}
                </p>
                <p className="text-sm text-emerald-600">{ganador.puntos} puntos</p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-1">Resultado</p>
                <p className="text-lg font-bold text-gray-500">Sin actividad</p>
              </>
            )}
          </div>

          {/* Premio */}
          {premio && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-center">
              <p className="text-xs text-amber-600 uppercase tracking-wide mb-1">Premio</p>
              <p className="text-sm font-medium text-amber-800">{premio}</p>
            </div>
          )}

          {/* Ranking final */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Ranking final
            </p>
            <div className="space-y-2">
              {ranking.map((item, index) => (
                <div
                  key={item.user.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                    index === 0 && item.puntos > 0
                      ? 'bg-emerald-50 border border-emerald-200'
                      : 'bg-gray-50'
                  }`}
                >
                  <span
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${
                      index === 0 && item.puntos > 0
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium truncate">
                    {item.user.nickname}
                  </span>
                  <span className="text-sm font-bold text-gray-600">
                    {item.puntos} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onCerrar}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white text-lg font-semibold rounded-xl shadow-sm transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}
