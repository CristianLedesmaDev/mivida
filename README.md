# Para Yaret 💌

Una cartita web interactiva: entra con un "login" bonito, avanza con clicks y va descubriendo
un contador del tiempo juntos, una carta dentro de un sobre, fotos tipo polaroid, razones para
amarla (con filtros por categoría), "te amo" en todos los idiomas, una línea de tiempo orbital
con sus recuerdos, un apartado dedicado a su música de Spotify (playlists y canciones con
portada real) y un final con lluvia de besos. Todo en modo claro, rosas pastel, toques rojo
vino y detalles "liquid glass".

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
la línea de tiempo, la música de Spotify y la pantalla final.

### Spotify

En la pestaña **🎧 Spotify** puedes agregar:
- **Playlists completas** (varias si quieres): en Spotify → abre la playlist → **Compartir →
  Copiar enlace al playlist** → pégalo ahí. Sale como reproductor grande con las portadas
  reales de las canciones.
- **Canciones sueltas**: mismo truco, copiar enlace de la canción. Con link se ve la portada
  real y el código para escanear; sin link se muestra como pendiente hasta que lo agregues.

## Publicar tus cambios: directo a GitHub (recomendado, sin base de datos)

Todo lo que edites en el panel se guarda primero en tu navegador. Para que **ella lo vea**,
necesitas publicarlo — y con esto configurado, publicar es solo tocar un botón, sin usar la
web de GitHub cada vez.

Esto vive dentro del panel en la pestaña **🚀 Publicar**, pero aquí está el resumen:

1. En GitHub: tu foto de perfil (arriba a la derecha) → **Settings** → baja hasta el final del
   menú izquierdo → **Developer settings**.
2. **Personal access tokens → Fine-grained tokens → Generate new token**.
3. Ponle un nombre (ej. "mi página"), en **Repository access** elige **Only select
   repositories** y selecciona tu repositorio.
4. Baja a **Permissions → Repository permissions**, busca **Contents** y cámbialo a
   **Read and write**.
5. Baja del todo y dale **Generate token**. Copia el token completo (empieza con
   `github_pat_`) — GitHub solo te lo muestra una vez.
6. En tu panel (`#panel` → pestaña **🚀 Publicar**), pega tu usuario de GitHub, el nombre del
   repositorio, y ese token. Desde ahí, cada **"Guardar y publicar"** sube tus cambios
   directo a `public/contenido.json` en tu repositorio, y en 1-2 minutos GitHub Pages la
   actualiza sola.

El token se guarda solo en este navegador (en `localStorage`), nunca sale de tu computadora
salvo para hablar directo con la API de GitHub.

### Fotos

Como no hay ningún servidor externo, las fotos que subas en el panel se comprimen y se
guardan como texto (base64) directo dentro de `contenido.json`. Esto funciona muy bien para
fotos normales de celular; si el archivo empieza a pesar mucho (muchísimas fotos grandes),
el panel te avisa para que quites o recortes alguna.

### Plan B: archivo mágico (sin token)

Úsalo si no quieres crear un token, o como respaldo. No se actualiza sola: hay que subir el
archivo a mano cada vez desde github.com.

1. En el panel, toca **"Descargar archivo mágico"** → se baja `contenido.json`.
2. En GitHub, abre tu repositorio → carpeta `public`.
3. **Add file → Upload files**, arrastra el `contenido.json` y dale **Commit changes**
   (reemplaza el que ya existe).
4. En 1-2 minutos la página se actualiza sola.

## Datos técnicos

- Vite + React + TypeScript, CSS a mano (sin frameworks de estilos).
- `framer-motion` para las animaciones de aparición y la línea de tiempo orbital.
- `three` para el fondo animado con shader, cargado aparte (code-splitting) para no pesar
  en la carga inicial.
- Los emojis animados son los [Noto Animated Emoji](https://googlefonts.github.io/noto-emoji-animation/)
  de Google, cargados desde su CDN.
- No hay backend ni base de datos: el contenido vive en `public/contenido.json`, y el panel
  lo actualiza directo vía la API de GitHub (Contents API) usando un token personal.
