import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: Devuelve todos los comentarios de una actividad específica
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const access_token = req.cookies.get("sb-access-token")?.value;
    if (!access_token)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // Obtener usuario autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);
  if (userError || !user)
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const { id } = await props.params;

  console.log("Actividad ID recibida:", id);

  if (!id) {
    return NextResponse.json({ error: "ID de actividad inválido" }, { status: 400 });
  }

  try {
    // Obtener todos los comentarios de la actividad
    const { data: comentarios, error: comentariosError } = await supabase
      .from("comentario")
      .select("*")
      .eq("actividad_id", id)
      .eq("eliminado", false)
      .order("created_at", { ascending: false });

    if (comentariosError) {
      console.error("Error de Supabase:", comentariosError.message);
      throw comentariosError;
    }

    // Obtener los IDs de usuario únicos
    const usuarioIds = [...new Set(comentarios.map((c: any) => c.usuario_id))];

    // Traer datos de usuarios
    const { data: usuarios, error: usuarioError } = await supabase
      .from("usuario")
      .select("id, nombre, apellido")
      .in("id", usuarioIds);

    // Traer perfiles
    const { data: perfiles, error: perfilError } = await supabase
      .from("perfil")
      .select("id, imagen")
      .in("id", usuarioIds);

    if (usuarioError || perfilError) {
      return NextResponse.json(
        { error: "Error obteniendo usuarios o perfiles" },
        { status: 500 }
      );
    }

    // Mapear usuario y perfil dentro de cada comentario
    const comentariosConUsuario = comentarios.map((c: any) => {
      const usuario = usuarios.find((u: any) => u.id === c.usuario_id) || {};
      const perfil = perfiles.find((p: any) => p.id === c.usuario_id) || {};
      return {
        ...c,
        usuario: {
          ...usuario,
          perfil,
        },
      };
    });

    return NextResponse.json(comentariosConUsuario);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Elimina un comentario específico (soft delete)
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const access_token = req.cookies.get("sb-access-token")?.value;
  if (!access_token)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // Obtener usuario autenticado
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(access_token);
  if (userError || !user)
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const { id } = await props.params;

  try {
    // Verificar si el comentario existe y pertenece al usuario
    const { data: comentario, error: getError } = await supabase
      .from("comentario")
      .select("usuario_id, eliminado")
      .eq("id", id)
      .single();

    if (getError || !comentario)
      return NextResponse.json(
        { error: "Comentario no encontrado" },
        { status: 404 }
      );

    if (comentario.eliminado)
      return NextResponse.json(
        { error: "El comentario ya fue eliminado" },
        { status: 400 }
      );

    if (comentario.usuario_id !== user.id) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar este comentario" },
        { status: 403 }
      );
    }

    // Soft delete → actualizar el campo eliminado = true
    const { error: updateError } = await supabase
      .from("comentario")
      .update({ eliminado: true })
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({
      message: "Comentario eliminado correctamente (soft delete)",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
