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
import math
import os


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
        result = self._post("claim")
        self.library_assets = result.get("snapshot", {}).get("mediaLibrary", {}).get("assets", [])
        return result

    def save_library_asset(self, path, title, description, tags, kind,
                           source_sha256=None, generation_id=None, asset_id=None):
        """Save reusable source bytes to the project's Frame.io folder, not an ad output.

        A local, locked receipt persists the UUID before the first network write.
        No job capabilities or signed URLs are written to disk.
        """
        import hashlib
        import fcntl
        file = pathlib.Path(path)
        mime = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
                ".webp": "image/webp", ".mp4": "video/mp4"}.get(file.suffix.lower())
        size = file.stat().st_size
        if not mime or not 100 <= size <= 250_000_000:
            raise ValueError("Library accepts JPEG/PNG/WebP/MP4 files, 100 bytes to 250 MB")
        digest = hashlib.sha256()
        with file.open("rb") as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                digest.update(chunk)
        sha = digest.hexdigest()
        for asset in getattr(self, "library_assets", []):
            if asset["sha256"] == sha and asset.get("available") and not asset.get("archived"):
                return asset
        ledger_path = pathlib.Path(".nxt-media-" + self.url.rsplit("/", 1)[-1] + ".json")
        with ledger_path.open("a+", encoding="utf8") as ledger:
            fcntl.flock(ledger.fileno(), fcntl.LOCK_EX)
            ledger.seek(0)
            text = ledger.read()
            receipts = json.loads(text) if text else {}
            data = receipts.get(sha)
            if not data:
                data = {"id": asset_id or str(uuid.uuid4()), "title": title,
                        "description": description, "tags": tags, "kind": kind,
                        "contentType": mime, "size": size, "sha256": sha}
                if source_sha256:
                    data["sourceSha256"] = source_sha256
                if generation_id:
                    data["generationId"] = generation_id
                receipts[sha] = data
                ledger.seek(0)
                ledger.truncate()
                json.dump(receipts, ledger)
                ledger.flush()
                import os
                os.fsync(ledger.fileno())
            grant = self._post("library/uploads", data)
            parts = grant["uploadParts"]
            if parts and sum(p["size"] for p in parts) != size:
                raise ValueError("Library upload parts do not match the source size")
            if parts:
                with file.open("rb") as stream:
                    for part in parts:
                        request = urllib.request.Request(part["url"], data=_PartReader(stream, part["size"]),
                            headers={"Content-Type": mime, "Content-Length": str(part["size"]),
                                     "x-amz-acl": "private"}, method="PUT")
                        with urllib.request.build_opener(_NoRedirect()).open(request, timeout=300) as response:
                            if not 200 <= response.status < 300:
                                raise RuntimeError("Frame.io source upload failed")
            for attempt in range(25):
                try:
                    result = self._post("library/complete", {"assetId": grant["id"]})
                    if result.get("archived") or not result.get("available"):
                        raise RuntimeError("Matching source is archived or unavailable; check the project library")
                    self.library_assets = getattr(self, "library_assets", []) + [result]
                    return result
                except BridgeRejected as error:
                    if error.status != 409 or "verwerkt de upload nog" not in error.detail or attempt == 24:
                        raise
                    time.sleep(5)

    def progress(self, percentage, message):
        self.refresh_usage()
        return self._post("progress", {"progress": percentage, "message": message})

    def library(self):
        """Current project originals; no new upload or reservation is needed."""
        return self._post("library", {})

    def report_usage(self, items):
        """Report observed per-operation usage without repeating paid work.

        Persist each item's eventId alongside its provider operation ID. Retries
        must reuse the identical eventId, units and optional USD estimate/basis.
        Never include capability/API tokens, prompts, signed URLs or credentials in costBasis.
        """
        return self._post("usage", {"items": items})

    def _usage_ledger(self):
        # Usage only, never API credentials, request bodies or transcript text.
        return pathlib.Path(".nxt-usage-" + self.url.rsplit("/", 1)[-1] + ".json")

    def _save_usage(self, item, request_info=None):
        """Persist before reporting; a reporting failure must NOT regenerate media."""
        import fcntl
        path = self._usage_ledger()
        fd = os.open(path, os.O_CREAT | os.O_RDWR, 0o600)
        with os.fdopen(fd, "r+", encoding="utf8") as ledger:
            fcntl.flock(ledger.fileno(), fcntl.LOCK_EX)
            raw = ledger.read()
            entries = json.loads(raw) if raw else {}
            receipt = entries.get(item["eventId"], {})
            previous = receipt.get("item", {})
            # Credit/history enrichment adds units to the same provider operation.
            item = {**previous, **item, "usage": {**previous.get("usage", {}), **item["usage"]}}
            entries[item["eventId"]] = {"item": item, "pending": bool(item["usage"]),
                                        "request": request_info or receipt.get("request")}
            ledger.seek(0)
            json.dump(entries, ledger)
            ledger.truncate()
            ledger.flush()
            os.fsync(ledger.fileno())

    def flush_usage(self):
        """Safe to retry. Only repeats portal accounting, never paid provider work."""
        import fcntl
        path = self._usage_ledger()
        if not path.exists():
            return {"pending": 0}
        with path.open("r+", encoding="utf8") as ledger:
            fcntl.flock(ledger.fileno(), fcntl.LOCK_EX)
            entries = json.load(ledger)
            pending = [value for value in entries.values() if value["pending"]]
            for offset in range(0, len(pending), 100):
                chunk = pending[offset:offset + 100]
                self.report_usage([value["item"] for value in chunk])
                for value in chunk:
                    value["pending"] = False
                ledger.seek(0)
                json.dump(entries, ledger)
                ledger.truncate()
                ledger.flush()
                os.fsync(ledger.fileno())
        return {"pending": 0}

    @staticmethod
    def _observed_number(value):
        # Do not let None/""/booleans turn missing billing evidence into zero.
        if isinstance(value, bool) or value is None or value == "":
            return None
        try:
            number = float(value)
        except (TypeError, ValueError):
            return None
        return number if math.isfinite(number) and 0 <= number <= 1e12 else None

    def record_elevenlabs(self, category, model, request_id, headers=None,
                         history=None, analytics=None, characters=None, seconds=None):
        """Capture actual charge metadata, not character/duration-based guesses.

        Pass raw-response headers (including character-cost and request-id).
        For delayed charges use the exact request's history/analytics response.
        The same request_id enriches the existing event, without double counting.
        """
        if category not in ("voiceover", "video", "music", "sound_effects") or not request_id or not model:
            raise ValueError("Require category, actual model and provider request ID")
        headers = {k.lower(): v for k, v in (headers or {}).items()}
        if headers.get("request-id") and headers["request-id"] != request_id:
            raise ValueError("Response belongs to another ElevenLabs request")
        usage = {}
        credit_values = []
        cost = self._observed_number(headers.get("character-cost"))
        if cost is not None:
            credit_values.append(cost)
        if history:
            if history.get("request_id") != request_id:
                raise ValueError("History belongs to another ElevenLabs request")
            start = self._observed_number(history.get("character_count_change_from"))
            end = self._observed_number(history.get("character_count_change_to"))
            if start is not None and end is not None and end >= start:
                credit_values.append(end - start)
        if analytics:
            columns, units = analytics.get("columns", []), analytics.get("column_units", [])
            if "request_id" in columns:
                index = columns.index("request_id")
                matches = [r for r in analytics.get("rows", []) if len(r) > index and r[index] == request_id]
                if len(matches) > 1:
                    raise ValueError("Ambiguous ElevenLabs request analytics")
                if matches:
                    # Units, not a guessed column name, identify the credits.
                    for i, unit in enumerate(units):
                        if unit == "credits" and len(matches[0]) > i:
                            value = self._observed_number(matches[0][i])
                            if value is not None:
                                credit_values.append(value)
        if credit_values:
            if any(value != credit_values[0] for value in credit_values):
                raise ValueError("Conflicting ElevenLabs charge evidence")
            usage["credits"] = credit_values[0]
        for key, value in (("characters", characters), ("seconds", seconds)):
            observed = self._observed_number(value)
            if observed is not None:
                usage[key] = observed
        self._save_usage({
            "eventId": str(uuid.uuid5(uuid.NAMESPACE_URL, "elevenlabs:" + request_id)),
            "category": category, "provider": "elevenlabs", "model": model, "usage": usage,
        }, {"id": request_id, "category": category, "model": model})
        if not usage:
            return {"reported": False, "reason": "Awaiting exact-request billing analytics; do not guess credits"}
        # Durable receipt remains pending on any failure. Caller can keep the
        # successfully generated media and flush later, instead of regenerating.
        try:
            self.flush_usage()
            return {"reported": True, "creditsKnown": "credits" in usage}
        except (BridgeRejected, OSError):
            return {"reported": False, "pending": True}

    def reconcile_elevenlabs(self, api_key=None):
        """Read-only, exact-request billing lookup for delayed/missing headers.

        Uses the cloud-injected ElevenLabs network secret by default. Never
        forwards the portal capability, and never attributes account-wide deltas.
        """
        path = self._usage_ledger()
        if not path.exists():
            return
        with path.open(encoding="utf8") as ledger:
            entries = json.load(ledger)
        missing = [e["request"] for e in entries.values()
                   if e.get("request") and "credits" not in e["item"]["usage"]]
        if not missing:
            return
        # Bounded read-only analytics requests, no retries or paid operations.
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["xi-api-key"] = api_key
        for offset in range(0, len(missing), 100):
            chunk = missing[offset:offset + 100]
            body = {"start_time": int((time.time() - 7 * 3600) * 1000), "limit": 100,
                    "filters": [{"column": "request_id", "operation": "in", "values": [r["id"] for r in chunk]}]}
            request = urllib.request.Request("https://api.elevenlabs.io/v1/workspace/analytics/requests",
                                             json.dumps(body).encode(), headers, method="POST")
            with urllib.request.build_opener(_NoRedirect()).open(request, timeout=30) as response:
                analytics = json.load(response)
            for r in chunk:
                self.record_elevenlabs(r["category"], r["model"], r["id"], analytics=analytics)

    def track_claude_session(self, transcript_path, session_id):
        """Bind explicitly to THIS job's session, never scan unrelated sessions."""
        uuid.UUID(session_id)
        self.usage_transcript = (str(pathlib.Path(transcript_path).resolve()), session_id)
        return self.refresh_usage()

    def _collect_claude_usage(self):
        path, session_id = self.usage_transcript
        main = pathlib.Path(path)
        if main.stem != session_id or main.suffix != ".jsonl":
            raise ValueError("Claude transcript must match the current session ID")
        # Child agents are stored under this main session's subagents directory.
        paths = [main, *sorted((main.parent / main.stem / "subagents").glob("agent-*.jsonl"))]
        messages = {}
        for source in paths:
            if source.is_symlink() or source.stat().st_size > 100_000_000:
                raise ValueError("Invalid or oversized Claude usage transcript")
            with source.open(encoding="utf8") as stream:
                for line in stream:
                    try:
                        row = json.loads(line)
                    except json.JSONDecodeError:
                        continue  # Last streamed line may still be incomplete.
                    if source == main and row.get("sessionId", row.get("session_id")) != session_id:
                        continue
                    message = row.get("message", {})
                    if row.get("type") != "assistant" or not isinstance(message, dict):
                        continue
                    mid, model, observed = message.get("id"), message.get("model"), message.get("usage", {})
                    if not mid or not model or not isinstance(observed, dict):
                        continue
                    usage = {}
                    for old, new in (("input_tokens", "inputTokens"), ("output_tokens", "outputTokens"),
                                     ("cache_read_input_tokens", "cacheReadTokens")):
                        n = self._observed_number(observed.get(old))
                        if n is not None:
                            usage[new] = n
                    if "inputTokens" not in usage or "outputTokens" not in usage:
                        continue
                    cache = observed.get("cache_creation") or {}
                    one_hour = self._observed_number(cache.get("ephemeral_1h_input_tokens"))
                    five_min = self._observed_number(cache.get("ephemeral_5m_input_tokens"))
                    aggregate = self._observed_number(observed.get("cache_creation_input_tokens"))
                    if one_hour is not None:
                        usage["cacheWrite1hTokens"] = one_hour
                    if five_min is not None:
                        usage["cacheWriteTokens"] = five_min
                    elif aggregate is not None:
                        usage["cacheWriteTokens"] = max(0, aggregate - (one_hour or 0))
                    # Streamed assistant chunks share an ID. Count each request
                    # once, keeping the latest/largest counters, including children.
                    old = messages.get((mid, model), {})
                    messages[(mid, model)] = {key: max(value, old.get(key, 0)) for key, value in {**old, **usage}.items()}
        models = {}
        for (_, model), usage in messages.items():
            total = models.setdefault(model, {})
            for unit, number in usage.items():
                total[unit] = total.get(unit, 0) + number
        for model, usage in models.items():
            self._save_usage({
                "eventId": str(uuid.uuid5(uuid.NAMESPACE_URL, "claude-code:" + session_id + ":" + model)),
                "category": "editing", "provider": "claude-code", "model": model,
                "usage": usage, "cumulative": True,
            })
        return len(models)

    def refresh_usage(self):
        if getattr(self, "usage_transcript", None):
            self._collect_claude_usage()
        if time.monotonic() - getattr(self, "_usage_reconciled_at", -1e9) > 60:
            self._usage_reconciled_at = time.monotonic()
            try:
                self.reconcile_elevenlabs()
            except (OSError, ValueError):
                # Analytics permissions/latency must not regenerate paid media.
                # Missing credits remain visibly missing in the portal.
                pass
        return self.flush_usage()

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
        self.refresh_usage()
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
        try:
            self.refresh_usage()
        except (BridgeRejected, OSError, ValueError):
            pass  # Keep durable receipts, but still mark the production failure.
        return self._post("fail", {"message": safe_message})
