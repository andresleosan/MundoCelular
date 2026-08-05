import { config } from "dotenv";
import { readFile } from "node:fs/promises";

config({ path: ".env.local" });

import { getAdminDb } from "../src/lib/firebase-admin";

const defaultPath = "qa/backups/configuracion-tienda-latest.json";
const PUBLIC_FIELDS = ["nombre", "whatsapp", "direccion", "ciudad", "departamento", "pais", "horario", "redes"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

type ConfigBackup = { collection: string; document: string; data: Record<string, unknown> };

function isBackup(value: unknown): value is ConfigBackup {
  if (!isRecord(value)) return false;
  const backup = value;
  const data = backup.data;
  if (!isRecord(data)) return false;
  const keys = Object.keys(data);
  return backup.collection === "configuracion"
    && backup.document === "tienda"
    && keys.every((key) => PUBLIC_FIELDS.includes(key as (typeof PUBLIC_FIELDS)[number]))
    && keys.length === PUBLIC_FIELDS.length
    && isRecord(data.redes);
}

async function main() {
  const inputPath = process.env.CONFIG_BACKUP_PATH || defaultPath;
  const backup = JSON.parse(await readFile(inputPath, "utf8")) as unknown;

  if (!isBackup(backup)) {
    throw new Error("El backup no tiene el formato esperado para configuracion/tienda");
  }

  const data = backup.data;
  await getAdminDb().collection(backup.collection).doc(backup.document).set({
    nombre: String(data.nombre),
    whatsapp: String(data.whatsapp),
    direccion: String(data.direccion),
    ciudad: String(data.ciudad),
    departamento: String(data.departamento),
    pais: String(data.pais),
    horario: String(data.horario),
    redes: {
      instagram: String((data.redes as Record<string, unknown>).instagram ?? ""),
      facebook: String((data.redes as Record<string, unknown>).facebook ?? ""),
      tiktok: String((data.redes as Record<string, unknown>).tiktok ?? ""),
    },
  });
  console.log(`Configuracion restaurada desde ${inputPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
