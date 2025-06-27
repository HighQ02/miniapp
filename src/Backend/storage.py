import mimetypes
import aioboto3
import boto3
import os
from config import BUCKET_NAME, ENDPOINT_URL, ACCESS_KEY, SECRET_KEY

session = aioboto3.Session()

async def upload_file_to_s3(local_path, object_name):
    content_type, _ = mimetypes.guess_type(local_path)
    if not content_type:
        content_type = "application/octet-stream"
    async with session.client(
        "s3",
        endpoint_url=ENDPOINT_URL,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY,
    ) as s3:
        with open(local_path, "rb") as f:
            data = f.read()
            await s3.put_object(
                Bucket=BUCKET_NAME,
                Key=object_name,
                Body=data,
                ContentType=content_type,
                ContentDisposition="inline"
            )
    return object_name

async def delete_file_from_s3(object_name):
    async with session.client(
        "s3",
        endpoint_url=ENDPOINT_URL,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY,
    ) as s3:
        await s3.delete_object(Bucket=BUCKET_NAME, Key=object_name)