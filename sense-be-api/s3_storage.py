import boto3

from config import settings

_UPLOAD_URL_EXPIRY_SECONDS = 300
_DOWNLOAD_URL_EXPIRY_SECONDS = 300

_client = boto3.client("s3", endpoint_url=settings.s3_endpoint_url)


def build_key(endeavor_id: str, file_id: str, name: str) -> str:
    return f"endeavors/{endeavor_id}/{file_id}-{name}"


def presigned_upload_url(key: str, content_type: str) -> str:
    return _client.generate_presigned_url(
        "put_object",
        Params={"Bucket": settings.s3_bucket_name, "Key": key, "ContentType": content_type},
        ExpiresIn=_UPLOAD_URL_EXPIRY_SECONDS,
    )


def presigned_download_url(key: str) -> str:
    return _client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket_name, "Key": key},
        ExpiresIn=_DOWNLOAD_URL_EXPIRY_SECONDS,
    )


def delete_object(key: str) -> None:
    _client.delete_object(Bucket=settings.s3_bucket_name, Key=key)
