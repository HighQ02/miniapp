import asyncpg
import asyncio
import json
from datetime import datetime, timedelta
from config import DATABASE_URL

class Database:
    def __init__(self):
        self.pool = None

    async def connect(self):
        self.pool = await asyncpg.create_pool(DATABASE_URL)

    async def get_user(self, user_id: int):
        async with self.pool.acquire() as conn:
            return await conn.fetchrow("SELECT * FROM users WHERE user_id = $1", user_id)

    async def create_user(self, user_id: int):
        async with self.pool.acquire() as conn:
            await conn.execute("INSERT INTO users (user_id) VALUES ($1) ON CONFLICT DO NOTHING", user_id)

    async def set_user_language(self, user_id: int, lang_code: str):
        async with self.pool.acquire() as conn:
            await conn.execute("UPDATE users SET language_code = $1 WHERE user_id = $2", lang_code, user_id)

    async def set_user_initialized(self, user_id: int):
        async with self.pool.acquire() as conn:
            await conn.execute("UPDATE users SET is_initialized = TRUE WHERE user_id = $1", user_id)

    async def add_subscription(self, user_id: int, days: int = 30):
        subscription = datetime.utcnow() + timedelta(days=days)
        async with self.pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO users (user_id, subscription)
                VALUES ($1, $2)
                ON CONFLICT (user_id) DO UPDATE SET subscription = $2;
            """, user_id, subscription)


    async def record_payment(self, user_id: int, telegram_payment_charge_id: str, provider_payment_charge_id: str, amount: int):
        async with self.pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO payments (user_id, telegram_payment_charge_id, provider_payment_charge_id, amount)
                VALUES ($1, $2, $3, $4)
            """, user_id, telegram_payment_charge_id, provider_payment_charge_id, amount)


    async def get_subscription(self, user_id: int):
        async with self.pool.acquire() as conn:
            result = await conn.fetchrow("""
                SELECT subscription FROM users WHERE user_id = $1;
            """, user_id)
            return result['subscription'] if result else None
        

    async def set_admin(self, user_id: int, is_admin: bool = True):
        async with self.pool.acquire() as conn:
            await conn.execute("UPDATE users SET is_admin = $1 WHERE user_id = $2", is_admin, user_id)

    async def remove_admin(self, user_id):
        async with self.pool.acquire() as conn:
            await conn.execute("UPDATE users SET is_admin = FALSE WHERE user_id = $1", user_id)


    async def get_user_profile(self, user_id: int):
        async with self.pool.acquire() as conn:
            return await conn.fetchrow("SELECT * FROM users WHERE user_id = $1", user_id)


    async def grant_access(self, user_id: int, delta: timedelta, now: datetime):
        async with self.pool.acquire() as conn:
            current = await conn.fetchval("SELECT subscription FROM users WHERE user_id = $1", user_id)
            base = now
            if current and current > now:
                base = current
            await conn.execute(
                "UPDATE users SET subscription = $1 WHERE user_id = $2",
                base + delta, user_id
            )

    async def remove_subscription(self, user_id):
        async with self.pool.acquire() as conn:
            await conn.execute("UPDATE users SET subscription = NULL WHERE user_id = $1", user_id)


    async def get_user_count(self):
        async with self.pool.acquire() as conn:
            return await conn.fetchval("SELECT COUNT(*) FROM users;")
    
    async def get_active_subscription_count(self):
        now = datetime.utcnow()
        async with self.pool.acquire() as conn:
            return await conn.fetchval("SELECT COUNT(*) FROM users WHERE subscription > $1;", now)


    async def set_one_time_access_used(self, user_id: int):
        async with self.pool.acquire() as conn:
            await conn.execute("UPDATE users SET used_one_time_access = TRUE WHERE user_id = $1;", user_id)


    async def has_used_one_time_access(self, user_id: int):
        async with self.pool.acquire() as conn:
            result = await conn.fetchval("SELECT used_one_time_access FROM users WHERE user_id = $1;", user_id)
            return result
        
    async def set_free_until(self, user_id: int, free_until: datetime):
        async with self.pool.acquire() as conn:
            await conn.execute("UPDATE users SET free_until = $1 WHERE user_id = $2", free_until, user_id)

    async def get_free_until(self, user_id: int):
        async with self.pool.acquire() as conn:
            return await conn.fetchval("SELECT free_until FROM users WHERE user_id = $1", user_id)


    async def is_admin(self, user_id: int) -> bool:
        async with self.pool.acquire() as conn:
            result = await conn.fetchrow("SELECT is_admin FROM users WHERE user_id = $1", user_id)
            return result and result['is_admin']
        

    async def insert_product(self, thumbnail, images, videos, has_video, is_hot):
        async with self.pool.acquire() as conn:
            result = await conn.fetchrow("""
                INSERT INTO products (thumbnail, images, videos, has_video, is_hot)
                VALUES ($1, $2::jsonb, $3::jsonb, $4, $5)
                RETURNING id;
            """, thumbnail, json.dumps(images), json.dumps(videos), has_video, is_hot)
            return result['id']
        
    async def update_product_files(self, product_id, thumbnail, images, videos):
        async with self.pool.acquire() as conn:
            await conn.execute("""
                UPDATE products
                SET thumbnail = $1,
                    images = $2,
                    videos = $3
                WHERE id = $4
            """, thumbnail, json.dumps(images), json.dumps(videos), product_id)

    async def update_product_fields(self, product_id: int, **fields):
        if not fields:
            return
        set_clause = ", ".join(f"{key} = ${i+2}" for i, key in enumerate(fields))
        values = list(fields.values())
        query = f"""
            UPDATE products
            SET {set_clause}
            WHERE id = $1
        """
        async with self.pool.acquire() as conn:
            await conn.execute(query, product_id, *values)

    async def get_all_products(self):
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, thumbnail, images, videos, has_video, is_hot
                FROM products
                ORDER BY id DESC
            """)
            return [dict(row) for row in rows]

    async def get_product_by_id(self, product_id: int):
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, thumbnail, images, videos, has_video, is_hot
                FROM products
                WHERE id = $1
            """, product_id)
            return dict(row) if row else None

    async def delete_product(self, product_id: int):
        async with self.pool.acquire() as conn:
            await conn.execute("""
                DELETE FROM products
                WHERE id = $1
            """, product_id)


    async def set_ref_code(self, user_id, code):
        async with self.pool.acquire() as conn:
            await conn.execute(
                "UPDATE users SET ref_code = $1 WHERE user_id = $2",
                code, user_id
            )

    async def get_user_by_ref_code(self, code):
        async with self.pool.acquire() as conn:
            return await conn.fetchrow(
                "SELECT * FROM users WHERE ref_code = $1",
                code
            )

    async def set_used_ref_code(self, user_id, code):
        async with self.pool.acquire() as conn:
            await conn.execute(
                "UPDATE users SET used_ref_code = $1 WHERE user_id = $2",
                code, user_id
            )

    async def add_ref_point(self, user_id):
        async with self.pool.acquire() as conn:
            await conn.execute(
                "UPDATE users SET ref_points = ref_points + 1 WHERE user_id = $1",
                user_id
            )

    async def remove_ref_points(self, user_id, count):
        async with self.pool.acquire() as conn:
            await conn.execute(
                "UPDATE users SET ref_points = ref_points - $1 WHERE user_id = $2 AND ref_points >= $1",
                count, user_id
            )


    async def get_all_user_ids(self):
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("SELECT user_id FROM users")
            return [row['user_id'] for row in rows]