# RMARC VIDEO AI + Granja de Bots — Base de pruebas v1

## Instalación
1. Descomprime el ZIP.
2. En una computadora con Node.js 20 o superior, abre una terminal en la carpeta.
3. Ejecuta `npm install` y luego `npm run dev`.
4. Abre la dirección local indicada por Vite.
5. Para generar archivos de producción ejecuta `npm run build`.

## Publicar en Vercel
Importa la carpeta del proyecto mediante un repositorio Git o despliega con Vercel CLI. Framework: Vite; build command: `npm run build`; output: `dist`. En un despliegue por ZIP, usa un flujo que admita importar código fuente y construirlo, no subas el ZIP como si fuera una web estática.

## Qué funciona realmente
- Catálogo editable de productos.
- Generación de guiones publicitarios mediante plantillas locales.
- Lectura en español con voces disponibles en el navegador.
- Bot de demostración que genera un guion diario **solo mientras la pestaña permanezca abierta**.
- Registro de prospectos y enlace a WhatsApp.
- Guardado local de datos y descarga de guiones TXT.

## Qué NO está implementado
- No genera MP4, no anima fotografías ni sincroniza labios.
- No contiene un modelo de IA generativa conectado.
- No publica en redes, no envía mensajes automáticamente ni busca clientes externos.
- No funciona 24/7 con la pestaña cerrada; necesita backend y tareas programadas.
- Los datos no se sincronizan entre teléfonos; localStorage no es una base de datos multiusuario.

## Próxima fase
Conservar esta base y conectar un backend con autenticación, Supabase, generador de guiones por IA, TTS y servicio GPU de animación. La publicación automática requiere autorización de las plataformas. No agregar credenciales secretas al frontend.
