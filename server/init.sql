-- Создание таблицы проектов
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    challenge TEXT,
    solution TEXT,
    result TEXT,
    short_description TEXT,
    client TEXT,
    cover TEXT,
    video_url TEXT,
    tags TEXT[],
    tech TEXT[],
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы контента сайта
CREATE TABLE site_content (
    id SERIAL PRIMARY KEY,
    section_key TEXT UNIQUE NOT NULL,
    content_json JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы сертификатов
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    company TEXT NOT NULL,
    division TEXT,
    position TEXT,
    image_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы пользователей (для админки)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы партнеров (для бегущей строки)
CREATE TABLE partners (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    width INTEGER DEFAULT 180,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
