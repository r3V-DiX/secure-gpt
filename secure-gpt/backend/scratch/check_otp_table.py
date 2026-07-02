import asyncio
from app.core.database import AsyncSessionLocal
from app.models.otp_code import OTPCode
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(OTPCode).order_by(OTPCode.created_at.desc()).limit(5))
        codes = res.scalars().all()
        print("=== LATEST OTP CODES ===")
        for c in codes:
            print(f"ID: {c.id} | Email: {c.email} | Created At: {c.created_at} | Used At: {c.used_at} | Attempts: {c.attempts} | Expires At: {c.expires_at}")

if __name__ == "__main__":
    asyncio.run(main())
