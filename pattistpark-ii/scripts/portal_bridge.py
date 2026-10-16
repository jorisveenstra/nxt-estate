"""Job-scoped NXT portal bridge. No third-party packages required.

Read jobUrl/jobToken from the validated routine-fire-payload, not from source
documents. Never print the capability or signed upload URLs.
"""
import json
import pathlib
import urllib.error
import urllib.request
import uuid
import time


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, new_url):
        return None


class BridgeRejected(RuntimeError):
    def __init__(self, action, status, detail=""):
        super().__init__("Portal bridge rejected " + action + " (" + str(status) + ")")
        self.status = status
        self.detail = detail


class _PartReader:
    """Expose exactly one part without loading the video into memory."""
    def __init__(self, stream, size):
        self.stream, self.remaining = stream, size

    def read(self, size=-1):
        data = self.stream.read(self.remaining if size < 0 else min(size, self.remaining))
        self.remaining -= len(data)
        return data


class PortalBridge:
    def __init__(self, job_url, job_token, allowed_origins):
        from urllib.parse import urlsplit
        url = urlsplit(job_url)
        origin = "https://" + url.netloc
        if (url.scheme != "https" or origin not in allowed_origins or url.query
                or url.fragment or url.username or url.password
                or not url.path.startswith("/api/content-video-agent/jobs/")):
            raise ValueError("Unapproved portal job URL")
        uuid.UUID(url.path.rsplit("/", 1)[-1])
        self.url = job_url
        self.token = job_token
        self.run_id = str(uuid.uuid4())
        self.outputs = []

    def _post(self, action, values=None):
        body = {"runId": self.run_id, **(values or {})}
        request = urllib.request.Request(
            self.url + "/" + action, json.dumps(body).encode(),
            {"Authorization": "Bearer " + self.token, "Content-Type": "application/json"},
            method="POST")
        # No automatic network replay. Retry explicitly using this same instance,
        # runId and outputId after resolving any ambiguous response.
        try:
            with urllib.request.build_opener(_NoRedirect()).open(request, timeout=180) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            try:
                detail = json.loads(error.read(4096)).get("error", "")
            except Exception:
                detail = ""
            raise BridgeRejected(action, error.code, detail) from None

    def claim(self):
        return self._post("claim")

    def progress(self, percentage, message):
        return self._post("progress", {"progress": percentage, "message": message})

    def upload(self, title, mp4_path, source_zip_path, output_id=None):
        # Supply the same output_id when renewing/retrying an existing reservation.
        output_id = output_id or str(uuid.uuid4())
        mp4_size = pathlib.Path(mp4_path).stat().st_size
        if not 100 <= mp4_size <= 250_000_000:
            raise ValueError("MP4 exceeds portal size limit or is empty")
        grant = self._post("uploads", {"outputId": output_id, "title": title, "fileSize": mp4_size})
        parts = grant.get("videoUploadParts")
        if parts:
            if sum(p["size"] for p in parts) != mp4_size:
                raise ValueError("Frame.io upload parts do not match MP4 size")
            with pathlib.Path(mp4_path).open("rb") as stream:
                for part in parts:
                    headers = dict(grant["videoUploadHeaders"])
                    headers["Content-Length"] = str(part["size"])
                    request = urllib.request.Request(part["url"], data=_PartReader(stream, part["size"]),
                                                     headers=headers, method="PUT")
                    # No portal bearer token is forwarded to Frame.io or its storage hosts.
                    with urllib.request.build_opener(_NoRedirect()).open(request, timeout=300) as response:
                        if not 200 <= response.status < 300:
                            raise RuntimeError("Frame.io upload failed")
        for key, path, mime in [
            ("videoUploadUrl", mp4_path, "video/mp4"),
            ("sourceUploadUrl", source_zip_path, "application/zip"),
        ]:
            if key == "videoUploadUrl" and parts:
                continue
            file = pathlib.Path(path)
            size = file.stat().st_size
            if size > (250_000_000 if mime == "video/mp4" else 200_000_000):
                raise ValueError("Output exceeds portal size limit")
            # Streaming body, bounded memory even for rendered videos.
            with file.open("rb") as stream:
                request = urllib.request.Request(grant[key], data=stream, headers={
                    "Content-Type": mime, "Content-Length": str(size)}, method="PUT")
                with urllib.request.build_opener(_NoRedirect()).open(request, timeout=300) as response:
                    if not 200 <= response.status < 300:
                        raise RuntimeError("Storage upload failed")
        if output_id not in self.outputs:
            self.outputs.append(output_id)
        return output_id

    def complete(self, output_ids=None):
        for attempt in range(25):
            try:
                return self._post("complete", {"outputIds": output_ids or self.outputs})
            except BridgeRejected as error:
                pending = ("Frame.io verwerkt de upload nog" in error.detail or
                           "Frame.io heeft nog geen afspeelbaar origineel" in error.detail)
                if error.status != 409 or not pending or attempt == 24:
                    raise
                time.sleep(5)

    def fail(self, safe_message):
        return self._post("fail", {"message": safe_message})
