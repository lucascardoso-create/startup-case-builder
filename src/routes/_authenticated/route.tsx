import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: GateAutenticado,
});

function GateAutenticado() {
  const navigate = useNavigate();
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    let ativo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      if (!data.session) navigate({ to: "/entrar", replace: true });
      else setPronto(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate({ to: "/entrar", replace: true });
    });

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  if (!pronto) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return <Outlet />;
}
