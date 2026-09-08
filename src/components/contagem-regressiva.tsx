import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

import { PRAZO, PRAZO_LABEL } from "@/lib/case";

export function useTempoRestante() {
  const [restante, setRestante] = useState(() => PRAZO.getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRestante(PRAZO.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const encerrado = restante <= 0;
  const total = Math.max(restante, 0);
  const horas = Math.floor(total / 3_600_000);
  const minutos = Math.floor((total % 3_600_000) / 60_000);
  const segundos = Math.floor((total % 60_000) / 1000);

  return { encerrado, horas, minutos, segundos };
}

function Bloco({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="flex min-w-14 flex-col items-center rounded-xl bg-primary-foreground/15 px-2 py-2 sm:min-w-16 sm:px-3">
      <span className="font-display text-xl leading-none tabular-nums sm:text-3xl">
        {String(valor).padStart(2, "0")}
      </span>
      <span className="mt-1 text-[10px] uppercase tracking-wide opacity-80">{rotulo}</span>
    </div>
  );
}

export function BarraContagem() {
  const { encerrado, horas, minutos, segundos } = useTempoRestante();

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-3 sm:flex-row sm:gap-4 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-2 text-center sm:text-left">
          <Clock className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
          <p className="text-xs font-medium sm:text-sm">
            {encerrado
              ? `As entregas foram encerradas em ${PRAZO_LABEL}.`
              : `Tempo restante para enviar sua entrega · prazo final ${PRAZO_LABEL}`}
          </p>
        </div>
        {!encerrado && (
          <div className="flex shrink-0 items-center gap-2">
            <Bloco valor={horas} rotulo="horas" />
            <Bloco valor={minutos} rotulo="min" />
            <Bloco valor={segundos} rotulo="seg" />
          </div>
        )}
      </div>
    </div>
  );
}

