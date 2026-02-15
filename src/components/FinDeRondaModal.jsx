export default function FinDeRondaModal({ finDeRonda, premio, onCerrar }) {
  if (!finDeRonda) return null

  const { ranking, winnerId, empate, ronda } = finDeRonda

  const ganador = ranking.find((r) => r.user.id === winnerId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-6 modal-overlay">
      <div className="glass-card w-full max-w-sm max-h-[90vh] overflow-y-auto modal-enter border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-celebrate">🏆</div>
            <h2 className="text-2xl font-bold text-white mb-1">¡Ronda finalizada!</h2>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
              {ronda.start_date} — {ronda.end_date}
            </p>
          </div>

          {/* Ganador o empate */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 mb-6 text-center shadow-[0_0_20px_rgba(16,185,129,0.1)] animate-scaleIn opacity-0" style={{ animationDelay: '0.2s' }}>
            {empate ? (
              <>
                <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] mb-2 font-bold">Resultado</p>
                <p className="text-2xl font-bold text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">¡Empate!</p>
              </>
            ) : ganador ? (
              <>
                <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] mb-2 font-bold">Ganador</p>
                <p className="text-2xl font-bold text-white mb-1">
                  {ganador.user.nickname}
                </p>
                <p className="text-sm font-bold text-emerald-400">{ganador.puntos} puntos</p>
              </>
            ) : (
              <>
                <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] mb-2 font-bold">Resultado</p>
                <p className="text-xl font-bold text-zinc-500">Sin actividad</p>
              </>
            )}
          </div>

          {/* Premio */}
          {premio && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8 text-center">
              <p className="text-[10px] text-amber-500 uppercase tracking-[0.2em] mb-1 font-bold">Premio</p>
              <p className="text-sm font-medium text-amber-200">{premio}</p>
            </div>
          )}

          {/* Ranking final */}
          <div className="mb-8">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4 text-center">
              Ranking final
            </p>
            <div className="space-y-3">
              {ranking.map((item, index) => (
                <div
                  key={item.user.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border stagger-item ${index === 0 && item.puntos > 0
                      ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                      : 'bg-zinc-900/50 border-white/5'
                    }`}
                  style={{ '--i': index }}
                >
                  <span
                    className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${index === 0 && item.puntos > 0
                        ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                        : 'bg-zinc-800 text-zinc-500'
                      }`}
                  >
                    {index + 1}
                  </span>
                  <span className={`flex-1 text-sm font-medium truncate ${index === 0 && item.puntos > 0 ? 'text-white' : 'text-zinc-400'}`}>
                    {item.user.nickname}
                  </span>
                  <span className={`text-sm font-bold ${index === 0 && item.puntos > 0 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                    {item.puntos} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onCerrar}
            className="w-full py-4 btn-aesthetic text-lg tracking-wide hover:scale-[1.02] shadow-[0_0_25px_rgba(16,185,129,0.4)] stagger-item"
            style={{ '--i': ranking.length }}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}
