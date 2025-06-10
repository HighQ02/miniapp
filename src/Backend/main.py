import json
import logging
import aiohttp_cors
from aiohttp import web
from mydb import Database
from datetime import datetime
import shutil
import ssl
import os

ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
ssl_context.load_cert_chain(
    '/Users/tamirlan/Desktop/Self Development/Kwork/firstKwork/my-app/src/Backend/cert.pem',
    '/Users/tamirlan/Desktop/Self Development/Kwork/firstKwork/my-app/src/Backend/key.pem'
)

db = Database()

async def startup(app):
    await db.connect()  # обязательно дожидаемся подключения

async def check_subscription(request):
    user_id = request.rel_url.query.get('user_id')
    if user_id is None:
        return web.json_response({"error": "user_id is required"}, status=400)
    try:
        user_id = int(user_id)
    except ValueError:
        return web.json_response({"error": "user_id must be int"}, status=400)
    try:
        subscription = await db.get_subscription(user_id)
    except Exception as e:
        logging.error(f"DB error when getting subscription for user_id={user_id}: {e}")
        return web.json_response({"error": "database error"}, status=500)

    if subscription is None:
        return web.json_response({"hasSubscription": False})

    now = datetime.utcnow()
    has_subscription = subscription > now
    return web.json_response({"hasSubscription": has_subscription})


async def check_admin(request):
    user_id = request.rel_url.query.get('user_id')
    if user_id is None:
        return web.json_response({"error": "user_id is required"}, status=400)
    try:
        user_id = int(user_id)
    except ValueError:
        return web.json_response({"error": "user_id must be int"}, status=400)
    try:
        is_admin = await db.is_admin(user_id)
    except Exception as e:
        logging.error(f"DB error when checking admin for user_id={user_id}: {e}")
        return web.json_response({"error": "database error"}, status=500)

    return web.json_response({"isAdmin": is_admin})

UPLOAD_DIR = 'firstKwork/my-app/src/Backend/Cloud'

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

async def handle_add_product(request):
    reader = await request.multipart()

    fields = {}
    temp_thumbnail_path = None
    temp_images = []
    temp_videos = []

    async for field in reader:
        if field.name == 'thumbnail':
            ext = os.path.splitext(field.filename)[1]
            thumbnail_filename = f"thumbnail{ext}"
            temp_path = os.path.join(UPLOAD_DIR, 'temp_' + thumbnail_filename)
            with open(temp_path, 'wb') as f:
                while True:
                    chunk = await field.read_chunk()
                    if not chunk:
                        break
                    f.write(chunk)
            fields['thumbnail_ext'] = ext
            temp_thumbnail_path = temp_path

        elif field.name == 'images':
            ext = os.path.splitext(field.filename)[1]
            temp_path = os.path.join(UPLOAD_DIR, 'temp_image_' + field.filename)
            with open(temp_path, 'wb') as f:
                while True:
                    chunk = await field.read_chunk()
                    if not chunk:
                        break
                    f.write(chunk)
            temp_images.append((temp_path, ext))

        elif field.name == 'videos':
            ext = os.path.splitext(field.filename)[1]
            temp_path = os.path.join(UPLOAD_DIR, 'temp_video_' + field.filename)
            with open(temp_path, 'wb') as f:
                while True:
                    chunk = await field.read_chunk()
                    if not chunk:
                        break
                    f.write(chunk)
            temp_videos.append((temp_path, ext))

        else:
            value = await field.text()
            fields[field.name] = value

    # Проверка обязательных полей
    if temp_thumbnail_path is None:
        return web.json_response({'error': 'Thumbnail is required'}, status=400)

    has_video = fields.get('has_video', 'false').lower() == 'true'
    is_hot = fields.get('is_hot', 'false').lower() == 'true'

    # Вставляем пустой продукт в БД, чтобы получить product_id
    product_id = await db.insert_product(
        thumbnail="",  # временно пусто
        images=[],     # временно пусто
        videos=[],
        has_video=has_video,
        is_hot=is_hot
    )

    # Создание директорий
    product_dir = os.path.join(UPLOAD_DIR, str(product_id))
    os.makedirs(product_dir, exist_ok=True)

    thumbnail_filename = f"thumbnail{fields['thumbnail_ext']}"
    final_thumbnail_path = os.path.join(product_dir, thumbnail_filename)
    os.rename(temp_thumbnail_path, final_thumbnail_path)

    image_filenames = []
    if temp_images:
        images_dir = os.path.join(product_dir, 'images')
        os.makedirs(images_dir, exist_ok=True)
        for idx, (temp_path, ext) in enumerate(temp_images, start=1):
            new_name = f"1_{idx:02d}{ext}"
            new_path = os.path.join(images_dir, new_name)
            os.rename(temp_path, new_path)
            image_filenames.append(f"images/{new_name}")

    video_filenames = []
    if temp_videos:
        videos_dir = os.path.join(product_dir, 'videos')
        os.makedirs(videos_dir, exist_ok=True)
        for idx, (temp_path, ext) in enumerate(temp_videos, start=1):
            new_name = f"2_{idx:02d}{ext}"
            new_path = os.path.join(videos_dir, new_name)
            os.rename(temp_path, new_path)
            video_filenames.append(f"videos/{new_name}")

    # Обновляем продукт в БД с реальными путями
    await db.update_product_files(
        product_id=product_id,
        thumbnail=thumbnail_filename,
        images=image_filenames,
        videos=video_filenames
    )

    return web.json_response({'status': 'success', 'product_id': product_id})


async def get_products(request):
    products = await db.get_all_products()

    result = []
    for product in products:
        product_id = product['id']
        # Преобразуем строки в списки, если нужно
        images = product['images']
        if isinstance(images, str):
            images = json.loads(images)
        videos = product['videos']
        if isinstance(videos, str):
            videos = json.loads(videos)
        result.append({
            'id': product_id,
            'thumbnail': f"/Cloud/{product_id}/{product['thumbnail']}" if product['thumbnail'] else None,
            'images': [f"/Cloud/{product_id}/{path}" for path in images],
            'videos': [f"/Cloud/{product_id}/{path}" for path in videos],
            'has_video': product['has_video'],
            'is_hot': product['is_hot']
        })

    return web.json_response(result)

async def get_product_by_id(request):
    product_id = request.match_info.get('id')
    try:
        product_id = int(product_id)
    except (TypeError, ValueError):
        return web.json_response({'error': 'Invalid product id'}, status=400)

    product = await db.get_product_by_id(product_id)
    if not product:
        return web.json_response({'error': 'Product not found'}, status=404)

    # Преобразуем строки в списки, если нужно
    images = product['images']
    if isinstance(images, str):
        images = json.loads(images)
    videos = product['videos']
    if isinstance(videos, str):
        videos = json.loads(videos)

    result = {
        'id': product_id,
        'thumbnail': f"/Cloud/{product_id}/{product['thumbnail']}" if product['thumbnail'] else None,
        'images': [f"/Cloud/{product_id}/{path}" for path in images],
        'videos': [f"/Cloud/{product_id}/{path}" for path in videos],
        'has_video': product['has_video'],
        'is_hot': product['is_hot']
    }
    return web.json_response(result)


async def delete_image(request):
    data = await request.json()
    product_id = int(data["product_id"])
    image = data["image"].lstrip("/")
    product = await db.get_product_by_id(product_id)
    if not product:
        return web.json_response({"error": "Product not found"}, status=404)

    # Логирование для отладки
    print("Удаление фото:", image)
    print("product_id:", product_id)

    # Корректный путь к файлу
    image_path = os.path.join(UPLOAD_DIR, str(product_id), *image.split("/"))
    print("image_path:", image_path)
    print("exists:", os.path.exists(image_path))
    if os.path.exists(image_path):
        os.remove(image_path)

    # Обновляем БД
    images = product["images"]
    if isinstance(images, str):
        images = json.loads(images)
    videos = product["videos"]
    if isinstance(videos, str):
        videos = json.loads(videos)
    print("images до:", images)
    images = [img for img in images if img != image]
    print("images после:", images)
    await db.update_product_files(product_id, product["thumbnail"], images, videos)
    return web.json_response({"status": "success"})

async def delete_video(request):
    data = await request.json()
    product_id = int(data["product_id"])
    video = data["video"].lstrip("/")
    product = await db.get_product_by_id(product_id)
    if not product:
        return web.json_response({"error": "Product not found"}, status=404)
    # Удаляем файл
    video_path = os.path.join(UPLOAD_DIR, str(product_id), video)
    if os.path.exists(video_path):
        os.remove(video_path)
    # Обновляем БД
    images = product["images"]
    if isinstance(images, str):
        images = json.loads(images)
    videos = product["videos"]
    if isinstance(videos, str):
        videos = json.loads(videos)
    videos = [v for v in videos if v != video]
    await db.update_product_files(product_id, product["thumbnail"], images, videos)
    return web.json_response({"status": "success"})

async def update_product(request):
    data = await request.json()
    product_id = int(data["product_id"])
    product = await db.get_product_by_id(product_id)
    if not product:
        return web.json_response({"error": "Product not found"}, status=404)
    # Обновляем только нужные поля
    fields = {}
    if "is_hot" in data:
        fields["is_hot"] = data["is_hot"]
    if "has_video" in data:
        fields["has_video"] = data["has_video"]
    await db.update_product_fields(product_id, **fields)
    return web.json_response({"status": "success"})

async def delete_product(request):
    data = await request.json()
    product_id = int(data["product_id"])
    # Удаляем папку с файлами
    product_dir = os.path.join(UPLOAD_DIR, str(product_id))
    if os.path.exists(product_dir):
        shutil.rmtree(product_dir)
    # Удаляем из БД
    await db.delete_product(product_id)
    return web.json_response({"status": "success"})


# Создаем приложение
app = web.Application()
app.on_startup.append(startup)

# Добавляем маршруты
app.add_routes([
    web.get('/check', check_subscription),
    web.get('/check-admin', check_admin),
    web.get('/products', get_products),
    web.get('/products/{id}', get_product_by_id),
    web.post('/admin/add-product', handle_add_product),
    web.post('/admin/delete-image', delete_image),
    web.post('/admin/delete-video', delete_video),
    web.post('/admin/update-product', update_product),
    web.post('/admin/delete-product', delete_product),
])


# Настраиваем CORS ПОСЛЕ добавления маршрутов
cors = aiohttp_cors.setup(app, defaults={
    "https://192.168.0.105:3000": aiohttp_cors.ResourceOptions(
        allow_credentials=True,
        expose_headers="*",
        allow_headers="*",
    )
})

# Применяем CORS ко всем маршрутам
for route in list(app.router.routes()):
    cors.add(route)


app.router.add_static('/Cloud/', os.path.abspath('firstKwork/my-app/src/Backend/Cloud'))


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    web.run_app(app, port=8000, ssl_context=ssl_context)



