# backend/app/services/email_renderer.py
"""
Email template rendering service using Jinja2.
Keeps email HTML rendering separated and cleanly structured.
"""

from pathlib import Path
from typing import Any, Dict
from jinja2 import Environment, FileSystemLoader, select_autoescape

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"

jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)


def render_email_template(template_name: str, context: Dict[str, Any]) -> str:
    """Render a Jinja2 email template with the given context."""
    template = jinja_env.get_template(template_name)
    return template.render(**context)
