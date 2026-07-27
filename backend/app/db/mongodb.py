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

    logger.info(f"Connecting to MongoDB at: {settings.mongo_uri}")
    _client = AsyncIOMotorClient(
        settings.mongo_uri,
        serverSelectionTimeoutMS=10000,
        connectTimeoutMS=10000,
    )

    # Verify connection is alive with retries
    connected = False
    for attempt in range(1, 4):
        try:
            await _client.admin.command("ping")
            logger.info("MongoDB connection established successfully.")
            connected = True
            break
        except Exception as e:
            logger.warning(f"MongoDB connection attempt {attempt}/3 failed: {e}")
            import asyncio
            await asyncio.sleep(2)

    if not connected:
        logger.error("Could not establish MongoDB connection after 3 attempts.")

    # Create indexes if connected
    if connected:
        try:
            db = _client[settings.mongo_db_name]
            collection = db["file_jobs"]
            await collection.create_index([("job_id", ASCENDING)], unique=True, background=True)
            await collection.create_index([("expires_at", ASCENDING)], background=True)
            await collection.create_index([("created_at", ASCENDING)], background=True)
            logger.info("MongoDB indexes ensured.")
        except Exception as idx_err:
            logger.warning(f"Failed to ensure indexes: {idx_err}")


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
