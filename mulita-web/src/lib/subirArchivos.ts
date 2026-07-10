import { supabase } from "./supabase";

// Utilidad para guardar archivos en Supabase Storage
export async function uploadFile(file: File, folder: string) {
  try {
    console.log("Llegue a subirArchivos");
    const arrayBuffer = await file.arrayBuffer(); // lee el archivo completo en memoria como un ArrayBuffer
    const buffer = Buffer.from(arrayBuffer); // convierte el ArrayBuffer a un Buffer de Node.js, que es lo que Supabase Storage espera

    // Nombre único para evitar sobreescritura
    const fileName = `${Date.now()}_${file.name}`;

    // Subir al bucket 'mulita-files' dentro de la carpeta correspondiente
    const { data, error } = await supabase.storage
      .from("mulita-files") // bucket único
      .upload(`${folder}/${fileName}`, buffer, {
        contentType: file.type, // tipo MIME del archivo
        cacheControl: "3600",
        upsert: false, // no sobreescribir archivos existentes
      });

    if (error) throw new Error(error.message); // Si hay un error al subir el archivo, lanza una excepción con el mensaje de error

    // Obtener URL pública
    const { data: publicData } = supabase.storage
      .from("mulita-files")
      .getPublicUrl(`${folder}/${fileName}`);

    console.log("publicURL: ", publicData.publicUrl)
    return publicData.publicUrl;
  } catch (err: any) {
    console.error("Error subiendo archivo:", err.message);
    throw new Error(err.message);
  }
}
