import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CambioContrasenaForm } from "./form";

export const metadata = { title: "Mi cuenta · Mis Finanzas" };

export default function CuentaPage() {
  return (
    <div className="mx-auto grid max-w-md gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Mi cuenta</h1>
      <Card>
        <CardHeader>
          <CardTitle>Cambiar contraseña</CardTitle>
          <CardDescription>Mínimo 12 caracteres.</CardDescription>
        </CardHeader>
        <CardContent>
          <CambioContrasenaForm />
        </CardContent>
      </Card>
    </div>
  );
}
