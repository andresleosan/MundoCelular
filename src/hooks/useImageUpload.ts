import { useState } from "react";
import { prepararImagenes } from "@/lib/image-compress";
import { useAuth } from "./useAuth";

interface UploadedImage {
  url: string;
  thumb: string;
  alt: string;
}

export function useImageUpload() {
  const { usuario } = useAuth();
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);

  async function subirImagen(file: File, alt?: string): Promise<UploadedImage> {
    if (!usuario) throw new Error("No autenticado");
    setSubiendo(true);
    setProgreso(0);

    try {
      const token = await usuario.getIdToken();
      const { full, thumb } = await prepararImagenes(file);
      setProgreso(30);

      const resFull = await fetch("/api/imagenes/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename: `${file.name}-full`, contentType: "image/webp", size: full.blob.size }),
      });
      const fullJson = await resFull.json();
      if (!resFull.ok || !fullJson.success) throw new Error(fullJson.error || "Error al generar URL de subida");
      const { url: fullSignedUrl, key: fullKey } = fullJson.data;

      const uploadRes = await fetch(fullSignedUrl, { method: "PUT", body: full.blob, headers: { "Content-Type": "image/webp" } });
      if (!uploadRes.ok) throw new Error("Error al subir imagen completa a R2");
      setProgreso(60);

      const resThumb = await fetch("/api/imagenes/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename: `${file.name}-thumb`, contentType: "image/webp", size: thumb.blob.size }),
      });
      const thumbJson = await resThumb.json();
      if (!resThumb.ok || !thumbJson.success) throw new Error(thumbJson.error || "Error al generar URL de subida thumb");
      const { url: thumbSignedUrl, key: thumbKey } = thumbJson.data;

      const thumbUploadRes = await fetch(thumbSignedUrl, { method: "PUT", body: thumb.blob, headers: { "Content-Type": "image/webp" } });
      if (!thumbUploadRes.ok) throw new Error("Error al subir thumbnail a R2");
      setProgreso(100);

      const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";
      const fullUrlPublic = `${publicBase}/${fullKey}`;
      const thumbUrlPublic = `${publicBase}/${thumbKey}`;

      return { url: fullUrlPublic, thumb: thumbUrlPublic, alt: alt || file.name };
    } finally {
      setSubiendo(false);
      setProgreso(0);
    }
  }

  async function eliminarImagen(key: string): Promise<void> {
    if (!usuario) throw new Error("No autenticado");
    const token = await usuario.getIdToken();
    const res = await fetch(`/api/imagenes/${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || "Error al eliminar imagen");
  }

  return { subirImagen, eliminarImagen, subiendo, progreso };
}
