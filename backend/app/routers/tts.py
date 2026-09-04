import hashlib
from collections import OrderedDict
from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response, StreamingResponse
import edge_tts
from pydantic import BaseModel, Field

from app.deps import get_current_user

router = APIRouter(prefix="/api", tags=["tts"])

VOICE_MAP = {
    "kn-IN": "kn-IN-GaganNeural", 
    "en-IN": "en-IN-NeerjaNeural",
    "en-US": "en-US-AriaNeural",
}

# In-memory LRU cache to store synthesized audio chunks
AUDIO_CACHE: OrderedDict[str, bytes] = OrderedDict()
MAX_CACHE_SIZE = 256


class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    lang: str = "en-IN"


def _cache_key(text: str, lang: str) -> str:
    return hashlib.sha256(f"{lang}:{text}".encode("utf-8")).hexdigest()


def _audio_response(text: str, lang: str) -> Response:
    key = _cache_key(text, lang)
    if key in AUDIO_CACHE:
        AUDIO_CACHE.move_to_end(key)
        return Response(content=AUDIO_CACHE[key], media_type="audio/mpeg")

    voice = VOICE_MAP.get(lang, "en-IN-NeerjaNeural")
    communicate = edge_tts.Communicate(text, voice)

    async def generate():
        collected: list[bytes] = []
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                collected.append(chunk["data"])
                yield chunk["data"]
        
        full_audio = b"".join(collected)
        if full_audio:
            AUDIO_CACHE[key] = full_audio
            if len(AUDIO_CACHE) > MAX_CACHE_SIZE:
                AUDIO_CACHE.popitem(last=False)

    return StreamingResponse(generate(), media_type="audio/mpeg")


@router.get("/tts")
async def get_tts(
    text: str = Query(..., min_length=1, max_length=5000),
    lang: str = Query("en-IN"),
    _current_user: dict = Depends(get_current_user),
):
    return _audio_response(text, lang)


@router.post("/tts")
async def post_tts(
    payload: TTSRequest,
    _current_user: dict = Depends(get_current_user),
):
    """POST avoids URL-length failures for longer English/Kannada replies."""
    return _audio_response(payload.text, payload.lang)

