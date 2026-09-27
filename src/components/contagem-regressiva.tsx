import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

import { PRAZO, PRAZO_LABEL } from "@/lib/case";

export function useTempoRestante(prazo: Date = PRAZO) {
  const [restante, setRestante] = useState(() => prazo.getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRestante(prazo.getTime() - Date.now()), 1000);
    setRestante(prazo.getTime() - Date.now());
    return () => clearInterval(id);
  }, [prazo]);

  const encerrado = restante <= 0;
  const total = Math.max(restante, 0);
  const horas = Math.floor(total / 3_600_000);
  const minutos = Math.floor((total % 3_600_000) / 60_000);
  const segundos = Math.floor((total % 60_000) / 1000);

  return { encerrado, horas, minutos, segundos };
}

function Bloco({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="flex min-w-16 flex-col items-center rounded-xl bg-primary-foreground/15 px-3 py-2">
      <span className="font-display text-2xl leading-none tabular-nums sm:text-3xl">
        {String(valor).padStart(2, "0")}
      </span>
      <span className="mt-1 text-[10px] uppercase tracking-wide opacity-80">{rotulo}</span>
    </div>
  );
}

export function BarraContagem({ prazo = PRAZO, label = PRAZO_LABEL }: { prazo?: Date; label?: string } = {}) {
  const { encerrado, horas, minutos, segundos } = useTempoRestante(prazo);

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-4 sm:flex-row">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <Clock className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            {encerrado
              ? `As entregas foram encerradas em ${label}.`
              : `Tempo restante para enviar sua entrega · prazo final ${label}`}
          </p>
        </div>
        {!encerrado && (
          <div className="flex items-center gap-2">
            <Bloco valor={horas} rotulo="horas" />
            <Bloco valor={minutos} rotulo="min" />
            <Bloco valor={segundos} rotulo="seg" />
          </div>
        )}
      </div>
    </div>
  );
}
