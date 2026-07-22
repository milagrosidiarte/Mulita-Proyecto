import { supabase } from "./supabase";

// Utilidad para guardar archivos en Supabase Storage
export async function uploadFile(file: File, folder: string) {
  try {
    console.log("Llegue a subirArchivos");
    const arrayBuffer = await file.arrayBuffer(); // lee el archivo completo en memoria como un ArrayBuffer. Un buffer es un tipo de dato que representa una cantidad fija de memoria contigua, y es útil para manejar datos binarios como archivos.
    const buffer = Buffer.from(arrayBuffer); // convierte el ArrayBuffer a un Buffer de Node.js, que es lo que Supabase Storage espera

    // Nombre único para evitar sobreescritura
    const fileName = `${Date.now()}_${file.name}`;

    // Subir al bucket 'mulita-files' dentro de la carpeta correspondiente
    const { data, error } = await supabase.storage
      .from("mulita-files") // bucket único
      .upload(`${folder}/${fileName}`, buffer, {
        contentType: file.type, // tipo MIME del archivo
        cacheControl: "3600", // tiempo de cache en segundos
        upsert: false, // no sobreescribir archivos existentes
      });

    if (error) throw new Error(error.message); // Si hay un error al subir el archivo, lanza una excepción con el mensaje de error

    // Obtener URL pública
    const { data: publicData } = supabase.storage
      .from("mulita-files")
      .getPublicUrl(`${folder}/${fileName}`); // Obtiene la URL pública del archivo subido para poder acceder a él desde cualquier lugar

    console.log("publicURL: ", publicData.publicUrl)
    return publicData.publicUrl; // Devuelve la URL pública del archivo subido
  } catch (err: any) {
    console.error("Error subiendo archivo:", err.message);
    throw new Error(err.message);
  }
}
