# Para Yaret 💌

Una cartita web interactiva: entra con un "login" bonito, avanza con clicks y va descubriendo
un contador del tiempo juntos, una carta dentro de un sobre, fotos tipo polaroid, razones para
amarla (con filtros por categoría), "te amo" en todos los idiomas, una línea de tiempo orbital
con sus recuerdos, notas de voz y un final con playlist de Spotify. Todo en modo claro, rosas
pastel, toques rojo vino y detalles "liquid glass".

## Cómo verla en tu compu

```bash
npm install
npm run dev
```

Abre el link que aparece (normalmente `http://localhost:5173`).

## Cómo subirla a GitHub para mandarle el link

1. Crea una cuenta en [github.com](https://github.com) si no tienes.
2. Crea un repositorio nuevo (botón **New**). Ponle un nombre bonito, por ejemplo `para-yaret`.
   Déjalo **Public** (necesario para que GitHub Pages sea gratis).
3. Sube este proyecto al repositorio. Desde esta carpeta, en una terminal:

   ```bash
   git init
   git add .
   git commit -m "Mi página para Yaret"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/para-yaret.git
   git push -u origin main
   ```

4. En GitHub, entra a tu repositorio → **Settings** → **Pages** → en "Build and deployment",
   elige **Source: GitHub Actions**.
5. Espera 1-2 minutos (pestaña **Actions** para ver el progreso). Tu página quedará en:

   ```
   https://TU-USUARIO.github.io/para-yaret/
   ```

   Ese es el link que le mandas. 💘

## Tu panel secreto (para editar sin programar)

- Entra a tu página y agrega `#panel` al final del link:
  `https://TU-USUARIO.github.io/para-yaret/#panel`
- También puedes tocar **5 veces** el corazoncito del pie de la última pantalla.
- PIN: **161224** (la fecha en que empezaron, ddmmaa). Se cambia en `src/content.ts`
  (`PIN_PANEL`).

El panel tiene un menú por secciones para editar TODO: lo básico (nombre, firma, fecha,
apodos), la entrada, la bienvenida, el contador, la carta, las fotos (se comprimen solas y
las recortas ahí mismo), las razones (con categorías), los "te amo" en todos los idiomas,
la línea de tiempo, los audios, la playlist con Spotify y la pantalla final.

### Spotify

En la pestaña **🎧 Playlist** pega el link de cada canción (en Spotify: compartir → copiar
enlace). En la página aparece el reproductor con la portada y el código de Spotify para
escanear.

## Publicar tus cambios: Supabase (recomendado)

Por defecto, sin nada configurado, la página muestra lo que hay en `public/contenido.json`
(el "Plan B" de abajo). Pero si conectas un proyecto gratis de **Supabase**, los cambios que
hagas en el panel se publican con un clic y **ella los ve sin que tú tengas que subir nada a
GitHub cada vez** — incluso en vivo, si ya tiene la página abierta cuando publicas.

Esto vive dentro del panel en la pestaña **🔌 Conexión**, pero aquí está el resumen:

1. Crea cuenta gratis en [supabase.com](https://supabase.com) y un proyecto nuevo.
2. Ve a **SQL Editor** del proyecto → pega y ejecuta esto (crea la tabla de contenido, sus
   permisos, y los buckets para fotos/audios):

   ```sql
   create table public.contenido (
     id int primary key default 1,
     data jsonb not null,
     updated_at timestamptz not null default now(),
     constraint solo_una_fila check (id = 1)
   );
   insert into public.contenido (id, data) values (1, '{}'::jsonb);
   alter table public.contenido enable row level security;

   create policy "lectura publica" on public.contenido
     for select using (true);
   create policy "solo admin escribe" on public.contenido
     for all using (auth.role() = 'authenticated')
     with check (auth.role() = 'authenticated');

   insert into storage.buckets (id, name, public) values ('fotos', 'fotos', true);
   insert into storage.buckets (id, name, public) values ('audios', 'audios', true);

   create policy "fotos lectura publica" on storage.objects
     for select using (bucket_id = 'fotos');
   create policy "fotos solo admin sube" on storage.objects
     for insert with check (bucket_id = 'fotos' and auth.role() = 'authenticated');
   create policy "audios lectura publica" on storage.objects
     for select using (bucket_id = 'audios');
   create policy "audios solo admin sube" on storage.objects
     for insert with check (bucket_id = 'audios' and auth.role() = 'authenticated');
   ```

3. Ve a **Authentication → Users → Add user** y crea tu usuario (tu correo + una contraseña).
   Esa va a ser tu cuenta de admin para publicar — nadie más la tiene.
4. Ve a **Project Settings → API** y copia el **Project URL** y la **anon public key**.
5. En tu computadora: copia `.env.local.example` a `.env.local` y pega ahí esos dos valores.
   Reinicia `npm run dev`.
6. Para que funcione también en la versión publicada (GitHub Pages): en tu repositorio →
   **Settings → Secrets and variables → Actions**, crea los secrets `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY` con esos mismos valores, y haz `git push` de nuevo (o vuelve a
   correr el workflow desde la pestaña Actions).
7. En tu panel (`#panel` → pestaña **🔌 Conexión**), inicia sesión con tu correo y contraseña.
   Desde ahí, cada **"Guardar y publicar"** actualiza la página al instante.

### Sobre la seguridad de este montaje

Es un proyecto personal (una carta para tu novia), no un banco — así que el nivel de
seguridad está pensado para eso: **cualquiera puede leer** el contenido (necesario para que
ella la vea sin cuenta), pero **solo quien inicie sesión con tu correo/contraseña puede
escribir** (gracias a las políticas RLS del script de arriba). La `anon key` de Supabase es
pública por diseño — vive en el código del sitio y está bien que así sea; lo que protege tus
datos son esas políticas, no que la llave sea secreta.

### Plan B: archivo mágico (sin Supabase)

Úsalo mientras conectas Supabase, o si prefieres no complicarte. No se actualiza sola: hay
que subir el archivo a mano cada vez.

1. En el panel, toca **"Descargar archivo mágico"** → se baja `contenido.json`.
2. En GitHub, abre tu repositorio → carpeta `public`.
3. **Add file → Upload files**, arrastra el `contenido.json` y dale **Commit changes**
   (reemplaza el que ya existe).
4. En 1-2 minutos la página se actualiza sola.

## Datos técnicos

- Vite + React + TypeScript, CSS a mano (sin frameworks de estilos).
- `framer-motion` para las animaciones de aparición y la línea de tiempo orbital.
- `@supabase/supabase-js` para el contenido en vivo, autenticación y Storage (fotos/audios).
- Los emojis animados son los [Noto Animated Emoji](https://googlefonts.github.io/noto-emoji-animation/)
  de Google, cargados desde su CDN.
- El contenido vive en Supabase si está conectado; si no, usa `public/contenido.json`; si
  falta, usa los textos de `src/content.ts`.
