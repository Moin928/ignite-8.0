from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
from PIL import Image
from io import BytesIO
import torch
from transformers import CLIPProcessor, CLIPModel
# import whisper # uncomment when using whisper
# from transformers import pipeline # for classification

app = FastAPI(title="CivicLens AI Engine")

# ==========================================
# 1. LOAD MODELS (Keep in memory)
# ==========================================
print("Loading CLIP Model (Image Similarity)...")
# Using standard CLIP which outputs 512-dim vectors
model_id = "openai/clip-vit-base-patch32"
processor = CLIPProcessor.from_pretrained(model_id)
model = CLIPModel.from_pretrained(model_id)

print("Models loaded successfully!")

class ReportRequest(BaseModel):
    image_url: str
    description: str = ""

@app.post("/process-report")
async def process_report(req: ReportRequest):
    """
    1. Downloads the image.
    2. Uses CLIP to generate a 512-D image embedding.
    3. (Mocked) Uses a vision model/ViT to classify issue and severity.
    4. (Mocked) Uses Whisper if audio was provided instead of text.
    """
    try:
        # 1. Fetch Image
        response = requests.get(req.image_url)
        image = Image.open(BytesIO(response.content)).convert("RGB")
        
        # 2. Generate CLIP Embedding (Image -> 512D Vector)
        inputs = processor(images=image, return_tensors="pt")
        with torch.no_grad():
            image_features = model.get_image_features(**inputs)
        
        # Normalize the embedding (best practice for cosine similarity)
        embedding = image_features / image_features.norm(p=2, dim=-1, keepdim=True)
        embedding_list = embedding.squeeze().tolist()
        
        # 3. Classify Image (Using zero-shot CLIP or a dedicated ViT model)
        # For hackathon, we simulate a ViT classification response
        # In reality: use `pipeline("image-classification", model="...")`
        
        # Simplified Zero-Shot classification with CLIP:
        candidate_labels = ["pothole", "garbage", "streetlight", "water_leakage", "road_damage"]
        inputs_text = processor(text=candidate_labels, images=image, return_tensors="pt", padding=True)
        with torch.no_grad():
            outputs = model(**inputs_text)
            logits_per_image = outputs.logits_per_image
            probs = logits_per_image.softmax(dim=1)
            
        best_idx = probs.argmax().item()
        predicted_category = candidate_labels[best_idx]
        
        # Mock severity for now (can use a separate lightweight regressor)
        severity = 7

        return {
            "success": True,
            "category": predicted_category,
            "severity": severity,
            "embedding": embedding_list, # 512 dimensions
            "embedding_type": "clip-vit-base-patch32"
        }
        
    except Exception as e:
        print(f"Error processing AI: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/verify-repair")
async def verify_repair(before_url: str, after_url: str):
    """
    Compare before and after images. If they are extremely similar (e.g. >95%), 
    it might be a fake repair (same image uploaded twice).
    If they are moderately similar but distinct, it's a valid repair.
    """
    # Logic goes here using CLIP image similarity
    return {"verified": True, "confidence": 0.89}

# Run with: uvicorn main:app --reload --port 8000
