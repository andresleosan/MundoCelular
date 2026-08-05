import { config } from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

config({ path: ".env.local" });

import { getAdminDb } from "../src/lib/firebase-admin";

const defaultPath = "qa/backups/configuracion-tienda-latest.json";
type PublicField = "nombre" | "whatsapp" | "direccion" | "ciudad" | "departamento" | "pais" | "horario" | "redes";

function publicConfig(value: Record<string, unknown> | undefined) {
  const data = value ?? {};
  const redes = data.redes && typeof data.redes === "object" && !Array.isArray(data.redes)
    ? data.redes as Record<string, unknown>
    : {};
  return {
    nombre: String(data.nombre ?? ""),
    whatsapp: String(data.whatsapp ?? ""),
    direccion: String(data.direccion ?? ""),
    ciudad: String(data.ciudad ?? ""),
    departamento: String(data.departamento ?? ""),
    pais: String(data.pais ?? ""),
    horario: String(data.horario ?? ""),
    redes: {
      instagram: String(redes.instagram ?? ""),
      facebook: String(redes.facebook ?? ""),
      tiktok: String(redes.tiktok ?? ""),
    },
  } satisfies Record<PublicField, unknown>;
}

async function main() {
  const outputPath = process.env.CONFIG_BACKUP_PATH || defaultPath;
  const snapshot = await getAdminDb().collection("configuracion").doc("tienda").get();

  if (!snapshot.exists) {
    throw new Error("No existe configuracion/tienda; no se creo un backup vacio");
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify({ collection: "configuracion", document: "tienda", data: publicConfig(snapshot.data()) }, null, 2)}\n`,
    "utf8",
  );
  console.log(`Backup creado en ${outputPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
