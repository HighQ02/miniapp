CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT PRIMARY KEY,
    language_code TEXT DEFAULT 'ru',
    is_initialized BOOLEAN DEFAULT FALSE,
    subscription TIMESTAMP,
    is_admin BOOLEAN DEFAULT FALSE,
	used_one_time_access BOOLEAN DEFAULT FALSE
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS ref_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ref_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS used_ref_code TEXT;

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),
    telegram_payment_charge_id TEXT,
    provider_payment_charge_id TEXT,
    amount INTEGER,
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    thumbnail TEXT NOT NULL,
    images JSONB NOT NULL,
    videos JSONB NOT NULL,
    has_video BOOLEAN NOT NULL DEFAULT FALSE,
    is_hot BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE products
ALTER COLUMN images SET DATA TYPE JSONB USING images::jsonb,
ALTER COLUMN videos SET DATA TYPE JSONB USING videos::jsonb;



DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS products;


SELECT * FROM users
SELECT * FROM payments
SELECT * FROM products

UPDATE users
SET subscription = NULL
WHERE user_id = 747588218;

UPDATE users
SET used_one_time_access = false
WHERE user_id = 6660631433;

DELETE FROM users WHERE user_id=6660631433;