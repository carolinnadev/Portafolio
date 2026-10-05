# Portafolio de Carolina Flórez

Guía para instalar y ejecutar el portafolio con FastAPI y configurar el formulario de contacto.

## Requisitos

- Windows PowerShell.
- Python 3.12 recomendado.
- Una cuenta de correo con SMTP habilitado. Para Gmail se necesita una contraseña de aplicación.

Comprueba que Python esté disponible:

```powershell
python --version
```

Si el comando no funciona, instala Python y vuelve a abrir la terminal.

## Preparar el proyecto

Abre PowerShell en la carpeta donde está este `README.md` y ejecuta:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Estos comandos crean un entorno virtual local e instalan FastAPI, Uvicorn y las dependencias del formulario.

## Configurar el correo

Si todavía no tienes un archivo `.env`, créalo a partir de la plantilla:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Abre `.env` y configura estos valores:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURITY=starttls
SMTP_USERNAME=carolinnadev@gmail.com
SMTP_PASSWORD=TU_CONTRASENA_DE_APLICACION
SMTP_FROM_EMAIL=carolinnadev@gmail.com
```

`SMTP_PASSWORD` debe ser una contraseña de aplicación de Google, no la contraseña normal de la cuenta. No compartas este dato ni lo escribas en `README.md`, `app.py` o `.env.example`. El archivo `.env` está excluido de Git.

El correo de confirmación se envía al email que la persona escribe en el formulario. El remitente autenticado y visible es `carolinnadev@gmail.com`.

## Iniciar FastAPI

Desde la raíz del proyecto ejecuta:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app:app --reload --host 127.0.0.1 --port 8001
```

Mantén esa terminal abierta mientras pruebas el sitio. No uses `main:app`: `main.py` es un ejemplo separado y no contiene el formulario ni el endpoint de correo.

Abre estas direcciones en el navegador:

- Portafolio: http://127.0.0.1:8001/
- Documentación interactiva de la API: http://127.0.0.1:8001/docs

Si el puerto 8001 ya está ocupado, cambia `--port 8001` por otro puerto libre y abre el mismo número en el navegador.

## Probar el formulario

1. Abre el portafolio desde `http://127.0.0.1:8001/`, no desde `index.html` directamente.
2. Ve a Contacto y completa nombre, correo y mensaje.
3. Envía el formulario.
4. La persona debe recibir un correo de agradecimiento con la firma de Carolina.

El endpoint `POST /api/contact` valida los datos y envía el correo. Un email inválido produce `422`; si falta o falla la configuración SMTP, el servidor informa el error y el formulario conserva el mensaje escrito.

## Solución de problemas

- **`python` no se reconoce:** instala Python 3.12, vuelve a abrir PowerShell y ejecuta `python --version`.
- **No encuentra Uvicorn:** vuelve a instalar dependencias con `\.venv\Scripts\python.exe -m pip install -r requirements.txt`.
- **El sitio no carga o sale 404:** confirma que abriste el puerto que aparece en la terminal de Uvicorn y que ejecutaste `app:app` desde la raíz del proyecto.
- **El servidor responde que el correo no está configurado:** revisa que `.env` exista en esta misma carpeta y que no queden valores de ejemplo.
- **Gmail rechaza el envío:** verifica que la verificación en dos pasos esté activa y que `SMTP_PASSWORD` sea una contraseña de aplicación vigente.
- **El correo no aparece:** revisa Spam y confirma que la cuenta de destino escrita en el formulario sea correcta.
