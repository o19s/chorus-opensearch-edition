from io import BytesIO
import requests
from PIL import Image
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from sentence_transformers import SentenceTransformer

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = SentenceTransformer("sentence-transformers/clip-ViT-B-32")

class EmbedRequest(BaseModel):
    text: Optional[str] = None
    image_url: Optional[str] = None

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/embed")
def embed(req: EmbedRequest):
    vec = [0.0] * 512
    try:
        if req.image_url and req.image_url.startswith("http"):
            resp = requests.get(req.image_url, timeout=5, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
            img = Image.open(BytesIO(resp.content)).convert("RGB")
            vec = model.encode(img, normalize_embeddings=True).tolist()
        elif req.text:
            vec = model.encode(req.text, normalize_embeddings=True).tolist()
    except Exception as e:
        print(f"CLIP encode fallback due to error: {e}")

    return {"embedding": vec}

