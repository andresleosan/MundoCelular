"use client";

import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { obtenerConfigTienda, guardarConfigTienda } from "@/lib/firestore/config";
import type { ConfigTienda } from "@/types";

const CONFIG_INICIAL: ConfigTienda = {
  nombre: "Mundo Celular",
  whatsapp: "573113554021",
  direccion: "Cra 36 # 38 - 33, Barrio El Salvador",
  ciudad: "Medellín",
  departamento: "Antioquia",
  pais: "Colombia",
  horario: "",
  redes: {
    instagram: "https://www.instagram.com/mundo_celular_75/",
    facebook: "https://www.facebook.com/Mundo.Celular.01",
    tiktok: "https://www.tiktok.com/@mundocelular75",
  },
};

export default function ConfiguracionAdmin() {
  const [config, setConfig] = useState<ConfigTienda>(CONFIG_INICIAL);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    obtenerConfigTienda().then((c) => { if (c) setConfig(c); });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await guardarConfigTienda(config);
    setMensaje("Configuración guardada");
    setTimeout(() => setMensaje(""), 3000);
  }

  const inputClase =
    "w-full rounded-chips border border-faint-border bg-pure-white px-4 py-2 text-[14px] text-ink-navy outline-none focus:border-mundo-blue";
  const labelClase = "mb-1 block text-[12px] font-medium text-steel-blue-gray";

  function campo(id: keyof ConfigTienda, etiqueta: string) {
    return (
      <div key={id}>
        <label htmlFor={id} className={labelClase}>{etiqueta}</label>
        <input id={id} value={config[id] as string} onChange={(e) => setConfig({ ...config, [id]: e.target.value })} className={inputClase} />
      </div>
    );
  }

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <h1 className="mb-6 text-[20px] font-semibold tracking-[-0.03em]">Configuración de la tienda</h1>
        <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4 rounded-cards bg-pure-white p-6 shadow-sm-2">
          {campo("nombre", "Nombre de la tienda")}
          {campo("whatsapp", "WhatsApp (formato 57XXXXXXXXXX)")}
          {campo("direccion", "Dirección")}
          {campo("ciudad", "Ciudad")}
          {campo("departamento", "Departamento")}
          {campo("pais", "País")}
          {campo("horario", "Horario de atención")}
          {mensaje && <p className="text-[12px] text-mundo-blue">{mensaje}</p>}
          <button type="submit" className="rounded-chips bg-mundo-blue px-6 py-3 text-[14px] font-semibold text-pure-white shadow-lg-2">
            Guardar
          </button>
        </form>
      </main>
    </>
  );
}
