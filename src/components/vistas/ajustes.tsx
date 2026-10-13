import Link from "next/link";
import { KeyRound, MessageCircle, Pencil, Plus, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Encabezado } from "@/components/app/encabezado";
import { Monto } from "@/components/app/monto";
import { HojaFormulario } from "@/components/fin/hoja-formulario";
import { Tarjeta, TituloTarjeta } from "@/components/fin/piezas";
import { formCategoria, formGrupoCategoria, formIngreso } from "@/lib/acciones/formularios";
import { SincronizarCalendario } from "@/components/fin/sincronizar-calendario";
import { EtiquetasAjustes } from "@/components/fin/etiquetas-ajustes";
import { cn } from "@/lib/utils";
import type { Datos } from "@/lib/finance/modelo";

export function VistaAjustes({ datos, calendarioToken = null }: { datos: Datos; calendarioToken?: string | null }) {
  return (
    <>
      <Encabezado titulo="Ajustes" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid content-start gap-6">
          <Tarjeta>
            <TituloTarjeta>Ingresos esperados</TituloTarjeta>
            <ul className="-mx-1 divide-y">
              {datos.ingresos.map((i) => (
                <li key={i.id} className="flex items-center gap-2 px-1 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{i.nombre}</p>
                    <p className="text-muted-foreground text-xs">
                      {i.es_variable ? "Variable" : "Fijo"} · {i.dia_pago ? `llega el ${i.dia_pago}` : "día por confirmar"}
                    </p>
                  </div>
                  {i.monto_esperado ? <Monto valor={i.monto_esperado} className="text-sm font-semibold" /> : <span className="text-muted-foreground text-xs">Variable</span>}
                  <HojaFormulario
                    titulo={i.nombre}
                    disparador={
                      <Button variant="ghost" size="icon" aria-label="Editar">
                        <Pencil />
                      </Button>
                    }
                    accion={formIngreso.bind(null, i.id)}
                    campos={[
                      { nombre: "monto", etiqueta: "Monto esperado al mes", tipo: "monto", inicial: i.monto_esperado, placeholder: "Vacío si es variable" },
                      { nombre: "dia_pago", etiqueta: "Día en que llega", tipo: "numero", inicial: i.dia_pago },
                    ]}
                  />
                </li>
              ))}
            </ul>
          </Tarjeta>
          <Tarjeta>
            <TituloTarjeta>📅 Google Calendar</TituloTarjeta>
            <SincronizarCalendario tokenInicial={calendarioToken} />
          </Tarjeta>
          <Tarjeta>
            <TituloTarjeta>Atajos</TituloTarjeta>
            <div className="grid gap-2">
              <Button variant="outline" asChild className="justify-start">
                <Link href="/recurrentes">
                  <Repeat />
                  Completar montos de pagos fijos
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link href="/cuenta">
                  <KeyRound />
                  Cambiar contraseña
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <Link href="/chat">
                  <MessageCircle />
                  Chat (requiere API key de Anthropic)
                </Link>
              </Button>
            </div>
            <p className="text-muted-foreground mt-3 text-xs">El tema claro/oscuro y el modo discreto (ojo) están en la barra superior o lateral.</p>
          </Tarjeta>
        </div>

        <div className="grid content-start gap-6 lg:col-span-2">
        <Tarjeta>
          <TituloTarjeta ayuda="Un gasto puede tener varias etiquetas además de su categoría">Etiquetas</TituloTarjeta>
          <EtiquetasAjustes etiquetas={datos.etiquetas} />
        </Tarjeta>
        <SeccionCategorias datos={datos} />
        </div>
      </div>
    </>
  );
}

const SECCIONES = [
  { tipo: "gasto", titulo: "Categorías de gastos", ayuda: "Qué compró. Un gasto tiene una sola categoría." },
  { tipo: "ingreso", titulo: "Categorías de ingresos", ayuda: "De dónde entró la plata." },
  { tipo: "transferencia", titulo: "Tipos de transferencia", ayuda: "Movimientos entre sus cuentas: no son gasto ni ingreso." },
] as const;

function SeccionCategorias({ datos }: { datos: Datos }) {
  return (
    <>
      {SECCIONES.map((sec) => {
        const grupos = datos.categorias.filter((c) => !c.parent_id && c.tipo === sec.tipo);
        return (
          <Tarjeta key={sec.tipo}>
            <TituloTarjeta ayuda={`${sec.ayuda} Toque una para cambiar su emoji o nombre.`}>{sec.titulo}</TituloTarjeta>
            <div className="grid gap-5 sm:grid-cols-2">
              {grupos.map((g) => (
                <div key={g.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <HojaFormulario
                      titulo="Editar grupo"
                      disparador={
                        <button className={cn("text-left text-sm font-semibold hover:underline", !g.activa && "line-through opacity-50")}>
                          {g.icono} {g.nombre}
                        </button>
                      }
                      accion={formCategoria.bind(null, g.id, null)}
                      campos={[
                        { nombre: "icono", etiqueta: "Emoji", tipo: "emoji", inicial: g.icono },
                        { nombre: "nombre", etiqueta: "Nombre", tipo: "texto", inicial: g.nombre },
                        { nombre: "activa", etiqueta: "Activo", tipo: "check", inicial: g.activa },
                      ]}
                    />
                    <HojaFormulario
                      titulo={`Nueva categoría en ${g.nombre}`}
                      disparador={
                        <Button variant="ghost" size="icon" aria-label={`Agregar a ${g.nombre}`}>
                          <Plus />
                        </Button>
                      }
                      accion={formCategoria.bind(null, null, g.id)}
                      campos={[
                        { nombre: "icono", etiqueta: "Emoji", tipo: "emoji", inicial: "📌" },
                        { nombre: "nombre", etiqueta: "Nombre", tipo: "texto" },
                      ]}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {datos.categorias
                      .filter((c) => c.parent_id === g.id)
                      .map((c) => (
                        <HojaFormulario
                          key={c.id}
                          titulo="Editar categoría"
                          disparador={
                            <button className={cn("bg-surface hover:bg-accent rounded-full px-3 py-1.5 text-xs", !c.activa && "line-through opacity-50")}>
                              {c.icono} {c.nombre}
                            </button>
                          }
                          accion={formCategoria.bind(null, c.id, g.id)}
                          campos={[
                            { nombre: "icono", etiqueta: "Emoji", tipo: "emoji", inicial: c.icono },
                            { nombre: "nombre", etiqueta: "Nombre", tipo: "texto", inicial: c.nombre },
                            { nombre: "activa", etiqueta: "Activa (aparece al registrar)", tipo: "check", inicial: c.activa },
                          ]}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>
            <HojaFormulario
              titulo="Nuevo grupo"
              descripcion="Un grupo reúne varias categorías (ej. Vivienda → Cuota, Mantenimiento…)."
              disparador={
                <Button variant="outline" size="sm" className="mt-4 rounded-full">
                  <Plus className="size-3.5" /> Nuevo grupo
                </Button>
              }
              accion={formGrupoCategoria.bind(null, sec.tipo)}
              campos={[
                { nombre: "icono", etiqueta: "Emoji", tipo: "emoji", inicial: "📁" },
                { nombre: "nombre", etiqueta: "Nombre", tipo: "texto" },
              ]}
            />
          </Tarjeta>
        );
      })}
    </>
  );
}
