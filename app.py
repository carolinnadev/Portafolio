"""Backend FastAPI del portafolio y entrega segura del formulario de contacto."""

from __future__ import annotations

import logging
import os
import smtplib
import ssl
import uuid
from email.message import EmailMessage
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

logger = logging.getLogger(__name__)
app = FastAPI(title="Portafolio de Carolina", version="1.0.0")


class ContactMessage(BaseModel):
    """Datos permitidos para un mensaje enviado desde el formulario público."""

    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    message: str = Field(min_length=10, max_length=5000)

    model_config = {"str_strip_whitespace": True}


class ChatMessage(BaseModel):
    """Estructura de entrada para las preguntas del chatbot."""

    message: str = Field(min_length=1, max_length=1000)
    session_id: str | None = None

    model_config = {"str_strip_whitespace": True}


def _send_contact_email(contact: ContactMessage) -> None:
    """Envía el formulario usando SMTP; ningún secreto se recibe desde el navegador."""
    smtp_host = os.getenv("SMTP_HOST", "").strip()
    smtp_username = os.getenv("SMTP_USERNAME", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    sender = os.getenv("SMTP_FROM_EMAIL", "").strip()
    security = os.getenv("SMTP_SECURITY", "starttls").strip().lower()

    if not all((smtp_host, smtp_username, smtp_password, sender)):
        raise HTTPException(
            status_code=503,
            detail="El correo todavía no está configurado en el servidor.",
        )

    if security not in {"ssl", "starttls"}:
        raise HTTPException(
            status_code=503,
            detail="La seguridad SMTP debe ser 'ssl' o 'starttls'.",
        )

    try:
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
    except ValueError as error:
        raise HTTPException(
            status_code=503,
            detail="SMTP_PORT debe ser un número válido.",
        ) from error

    email = EmailMessage()
    email["Subject"] = "Gracias por contactarme"
    email["From"] = sender
    email["To"] = str(contact.email)
    email["Reply-To"] = sender
    email.set_content(
        f"Hola {contact.name},\n\n"
        "Gracias por contactarme. En breve me estaré comunicando con usted.\n\n"
        "Atentamente,\n"
        "Carolina Flórez\n"
    )

    try:
        tls_context = ssl.create_default_context()
        if security == "ssl":
            connection = smtplib.SMTP_SSL(
                smtp_host,
                smtp_port,
                timeout=15,
                context=tls_context,
            )
        else:
            connection = smtplib.SMTP(smtp_host, smtp_port, timeout=15)

        with connection as server:
            if security == "starttls":
                server.starttls(context=tls_context)
            server.login(smtp_username, smtp_password)
            server.send_message(email)
    except (OSError, smtplib.SMTPException):
        logger.exception("No se pudo entregar el mensaje del formulario por SMTP.")
        raise HTTPException(
            status_code=502,
            detail="No se pudo enviar el mensaje. Inténtalo de nuevo más tarde.",
        ) from None


@app.post("/api/contact")
def receive_contact(contact: ContactMessage) -> dict[str, str]:
    """Valida el formulario y envía un acuse al correo indicado por el visitante."""
    _send_contact_email(contact)
    return {"message": "Gracias por contactarme. En breve me estaré comunicando con usted."}


@app.post("/api/chat")
async def chat_with_n8n(chat_input: ChatMessage) -> dict[str, str | None]:
    """Recibe la pregunta del frontend y la reenvía al Webhook de n8n."""
    n8n_webhook_url = os.getenv("N8N_WEBHOOK_URL", "").strip()

    if not n8n_webhook_url:
        raise HTTPException(
            status_code=503,
            detail="El webhook de n8n no está configurado.",
        )

    session_id = chat_input.session_id or str(uuid.uuid4())

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                n8n_webhook_url,
                json={
                    "message": chat_input.message,
                    "session_id": session_id,
                },
            )
            response.raise_for_status()
            data = response.json()

            reply = data.get("output") or data.get("reply") or data.get("message", "")

            return {"reply": reply, "session_id": session_id}

    except httpx.HTTPError:
        logger.exception("Error al comunicarse con el Webhook de n8n.")
        raise HTTPException(
            status_code=502,
            detail="No se pudo conectar con el servicio de chat en este momento.",
        ) from None


# Se sirven solo los archivos públicos necesarios; el directorio raíz y .env no se exponen.
@app.get("/", include_in_schema=False)
def serve_home() -> FileResponse:
    return FileResponse(BASE_DIR / "index.html")


@app.get("/style.css", include_in_schema=False)
def serve_stylesheet() -> FileResponse:
    return FileResponse(BASE_DIR / "style.css", media_type="text/css")


@app.get("/script.js", include_in_schema=False)
def serve_script() -> FileResponse:
    return FileResponse(BASE_DIR / "script.js", media_type="text/javascript")


app.mount("/img", StaticFiles(directory=BASE_DIR / "img"), name="images")