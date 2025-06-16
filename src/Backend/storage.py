import aioboto3

BUCKET_NAME = "mini-app-storage"
ENDPOINT_URL = "https://check-bot.top"
ACCESS_KEY = "YCAJEpOQBOomKtXw9sX3Q8U5H"
SECRET_KEY = "YCPdsxA8m1-mcGozFDMx5Vkz-F_R8fHHws73fuD7"

session = aioboto3.Session()

async def upload_file_to_s3(local_path, object_name):
    async with session.client(
        "s3",
        endpoint_url=ENDPOINT_URL,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY,
    ) as s3:
        with open(local_path, "rb") as f:
            await s3.upload_fileobj(f, BUCKET_NAME, object_name)
    return object_name

async def delete_file_from_s3(object_name):
    async with session.client(
        "s3",
        endpoint_url=ENDPOINT_URL,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY,
    ) as s3:
        await s3.delete_object(Bucket=BUCKET_NAME, Key=object_name)