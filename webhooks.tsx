import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/404")({
  component: NotFound,
});

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <h2 className="mt-4 text-2xl font-semibold">Página não encontrada</h2>
      <p className="mt-2 text-muted-foreground">
        Desculpe, a página que você está procurando não existe ou foi movida.
      </p>
      <Button className="mt-8" asChild>
        <a href="/">Voltar para a Home</a>
      </Button>
    </div>
  );
}
