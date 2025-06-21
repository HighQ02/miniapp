import json
import logging
import aiohttp_cors
from aiohttp import web
from mydb import Database
from datetime import datetime
from storage import upload_file_to_s3, delete_file_from_s3
import os

db = Database()

async def startup(app):
    await db.connect()

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
        free_until = await db.get_free_until(user_id)  # добавьте этот метод в mydb.py
    except Exception as e:
        logging.error(f"DB error when getting subscription for user_id={user_id}: {e}")
        return web.json_response({"error": "database error"}, status=500)

    now = datetime.utcnow()
    has_subscription = subscription and subscription > now
    user = await db.get_user_profile(user_id)
    lang = user["language_code"] if user and user.get("language_code") else "ru"
    return web.json_response({
        "hasSubscription": has_subscription,
        "free_until": free_until.isoformat() if free_until else None,
        "lang": lang
    })

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

# S3 config
BUCKET_NAME = "mini-app-storage"
S3_BASE_URL = f"https://check-bot.top/{BUCKET_NAME}"

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
            temp_path = f"/tmp/temp_{thumbnail_filename}"
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
            temp_path = f"/tmp/temp_image_{field.filename}"
            with open(temp_path, 'wb') as f:
                while True:
                    chunk = await field.read_chunk()
                    if not chunk:
                        break
                    f.write(chunk)
            temp_images.append((temp_path, ext))

        elif field.name == 'videos':
            ext = os.path.splitext(field.filename)[1]
            temp_path = f"/tmp/temp_video_{field.filename}"
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

    if temp_thumbnail_path is None:
        return web.json_response({'error': 'Thumbnail is required'}, status=400)

    has_video = fields.get('has_video', 'false').lower() == 'true'
    is_hot = fields.get('is_hot', 'false').lower() == 'true'

    product_id = await db.insert_product(
        thumbnail="",
        images=[],
        videos=[],
        has_video=has_video,
        is_hot=is_hot
    )

    # Загрузка thumbnail
    thumbnail_filename = f"thumbnail{fields['thumbnail_ext']}"
    thumbnail_object_name = f"{product_id}/{thumbnail_filename}"
    await upload_file_to_s3(temp_thumbnail_path, thumbnail_object_name)
    os.remove(temp_thumbnail_path)

    # Загрузка изображений
    image_filenames = []
    for idx, (temp_path, ext) in enumerate(temp_images, start=1):
        new_name = f"images/1_{idx:02d}{ext}"
        object_name = f"{product_id}/{new_name}"
        await upload_file_to_s3(temp_path, object_name)
        os.remove(temp_path)
        image_filenames.append(new_name)

    # Загрузка видео
    video_filenames = []
    for idx, (temp_path, ext) in enumerate(temp_videos, start=1):
        new_name = f"videos/2_{idx:02d}{ext}"
        object_name = f"{product_id}/{new_name}"
        await upload_file_to_s3(temp_path, object_name)
        os.remove(temp_path)
        video_filenames.append(new_name)

    await db.update_product_files(
        product_id=product_id,
        thumbnail=thumbnail_filename,
        images=image_filenames,
        videos=video_filenames
    )

    return web.json_response({'status': 'success', 'product_id': product_id})

def s3_url(object_name):
    return f"{S3_BASE_URL}/{object_name}"

async def get_products(request):
    products = await db.get_all_products()
    result = []
    for product in products:
        product_id = product['id']
        images = product['images']
        if isinstance(images, str):
            images = json.loads(images)
        videos = product['videos']
        if isinstance(videos, str):
            videos = json.loads(videos)
        result.append({
            'id': product_id,
            'thumbnail': s3_url(f"{product_id}/{product['thumbnail']}") if product['thumbnail'] else None,
            'images': [s3_url(f"{product_id}/{path}") for path in images],
            'videos': [s3_url(f"{product_id}/{path}") for path in videos],
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

    images = product['images']
    if isinstance(images, str):
        images = json.loads(images)
    videos = product['videos']
    if isinstance(videos, str):
        videos = json.loads(videos)

    result = {
        'id': product_id,
        'thumbnail': s3_url(f"{product_id}/{product['thumbnail']}") if product['thumbnail'] else None,
        'images': [s3_url(f"{product_id}/{path}") for path in images],
        'videos': [s3_url(f"{product_id}/{path}") for path in videos],
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

    object_name = f"{product_id}/{image}"
    await delete_file_from_s3(object_name)

    images = product["images"]
    if isinstance(images, str):
        images = json.loads(images)
    videos = product["videos"]
    if isinstance(videos, str):
        videos = json.loads(videos)
    images = [img for img in images if img != image]
    await db.update_product_files(product_id, product["thumbnail"], images, videos)
    return web.json_response({"status": "success"})

async def delete_video(request):
    data = await request.json()
    product_id = int(data["product_id"])
    video = data["video"].lstrip("/")
    product = await db.get_product_by_id(product_id)
    if not product:
        return web.json_response({"error": "Product not found"}, status=404)

    object_name = f"{product_id}/{video}"
    await delete_file_from_s3(object_name)

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
    product = await db.get_product_by_id(product_id)
    if not product:
        return web.json_response({"error": "Product not found"}, status=404)

    # Удаляем все файлы товара из S3
    images = product["images"]
    if isinstance(images, str):
        images = json.loads(images)
    videos = product["videos"]
    if isinstance(videos, str):
        videos = json.loads(videos)
    files_to_delete = []
    if product["thumbnail"]:
        files_to_delete.append(f"{product_id}/{product['thumbnail']}")
    files_to_delete += [f"{product_id}/{img}" for img in images]
    files_to_delete += [f"{product_id}/{vid}" for vid in videos]
    for obj in files_to_delete:
        await delete_file_from_s3(obj)

    await db.delete_product(product_id)
    return web.json_response({"status": "success"})

# Создаем приложение
app = web.Application(client_max_size=500*1024**2)
app.on_startup.append(startup)

app.add_routes([
    web.get('/check', check_subscription),
    web.get('/check-admin', check_admin),
    web.get('/', get_products),
    web.get('/products/{id}', get_product_by_id),
    web.post('/admin/add-product', handle_add_product),
    web.post('/admin/delete-image', delete_image),
    web.post('/admin/delete-video', delete_video),
    web.post('/admin/update-product', update_product),
    web.post('/admin/delete-product', delete_product),
])

cors = aiohttp_cors.setup(app, defaults={
    "https://check-bot.top": aiohttp_cors.ResourceOptions(
        allow_credentials=True,
        expose_headers="*",
        allow_headers="*",
    )
})

for route in list(app.router.routes()):
    cors.add(route)

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    web.run_app(app, port=8000)