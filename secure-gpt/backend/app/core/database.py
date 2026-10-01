# backend/app/core/database.py
# ─────────────────────────────────────────────────────────────────────────────
# Async SQLAlchemy engine + session factory.
#
# TRANSACTION STRATEGY:
# - get_db() does NOT auto-commit. Routes own their transactions.
# - Routes call db.commit() explicitly when they want to persist.
# - get_db() only handles rollback on exception + session close.
# - This prevents double-commit issues.
# ─────────────────────────────────────────────────────────────────────────────

from app.core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

engine = create_async_engine(
    settings.database_url,
    echo=settings.sqlalchemy_echo,
    hide_parameters=not settings.debug,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:  # type: ignore[return]
    """
    Yields an async DB session. Routes are responsible for calling db.commit().
    Rolls back automatically on any unhandled exception.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()