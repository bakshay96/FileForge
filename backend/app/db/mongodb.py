"""
FileForge — MongoDB Async Client (Motor)
─────────────────────────────────────────────────────────────────────────────
Provides a single Motor AsyncIOMotorClient instance shared across the app.
Uses dependency injection pattern via FastAPI's app state.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING
from pymongo.errors import ConnectionFailure

from app.config.settings import settings

logger = logging.getLogger(__name__)

# Module-level client reference
_client: AsyncIOMotorClient | None = None


async def connect_to_mongo() -> None:
    """
    Create the Motor client and verify connectivity.
    Called during FastAPI startup lifespan.
    """
    global _client

    # Mask password in log output for security
    safe_uri = settings.mongo_uri.split("@")[-1] if "@" in settings.mongo_uri else settings.mongo_uri
    logger.info(f"        Connecting to → ...@{safe_uri}")

    _client = AsyncIOMotorClient(
        settings.mongo_uri,
        serverSelectionTimeoutMS=10000,
        connectTimeoutMS=10000,
    )

    # Verify connection with retries
    connected = False
    for attempt in range(1, 4):
        try:
            logger.info(f"        Attempt {attempt}/3 — pinging MongoDB...")
            await _client.admin.command("ping")
            logger.info("        ✔  MongoDB connected successfully!")
            connected = True
            break
        except Exception as e:
            logger.warning(f"        ✘  Attempt {attempt}/3 failed: {e}")
            import asyncio
            await asyncio.sleep(2)

    if not connected:
        logger.error("        ✘  Could not connect to MongoDB after 3 attempts. Check MONGO_URI in .env")
        return

    # Create indexes
    try:
        db = _client[settings.mongo_db_name]
        collection = db["file_jobs"]
        await collection.create_index([("job_id", ASCENDING)], unique=True, background=True)
        await collection.create_index([("expires_at", ASCENDING)], background=True)
        await collection.create_index([("created_at", ASCENDING)], background=True)
        logger.info(f"        ✔  DB: '{settings.mongo_db_name}' | Indexes ready")
    except Exception as idx_err:
        logger.warning(f"        ⚠  Index creation warning: {idx_err}")


async def close_mongo_connection() -> None:
    """Close the Motor client on FastAPI shutdown."""
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB connection closed.")


async def get_database() -> AsyncIOMotorDatabase:
    """
    Return the application database instance.
    Used by services and the cleanup scheduler.

    Raises:
        RuntimeError: If called before connect_to_mongo().
    """
    global _client
    if _client is None:
        raise RuntimeError(
            "MongoDB client is not initialized. "
            "Ensure connect_to_mongo() was called during startup."
        )
    return _client[settings.mongo_db_name]
