import os
import base64
import numpy as np
import cv2
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace
from typing import List, Optional
import uvicorn
import shutil
import tempfile

app = FastAPI(title="BJJ DeepFace API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global models configuration
# Using Facenet512 as it's one of the most accurate
MODEL_NAME = "S-Face"
DETECTOR_BACKEND = "retinaface" # RetinaFace is best for small faces in group photos

@app.get("/")
async def root():
    return {"message": "BJJ DeepFace API is running", "model": MODEL_NAME, "detector": DETECTOR_BACKEND}

@app.post("/detect")
async def detect_faces(file: UploadFile = File(...)):
    """Detects all faces in an image and returns their coordinates."""
    temp_dir = tempfile.mkdtemp()
    try:
        file_path = os.path.join(temp_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Detect faces
        objs = DeepFace.extract_faces(
            img_path=file_path, 
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=False,
            align=True
        )
        
        results = []
        for obj in objs:
            facial_area = obj["facial_area"]
            confidence = obj["confidence"]
            
            # Extract embedding for representation
            # This allows us to get the descriptor in the same call
            embedding_objs = DeepFace.represent(
                img_path=file_path,
                model_name=MODEL_NAME,
                detector_backend=DETECTOR_BACKEND,
                enforce_detection=False
            )
            
            # Match the face area to find corresponding embedding
            # In a real scenario we'd optimize this, but for testing it's fine
            results.append({
                "box": {
                    "x": facial_area["x"],
                    "y": facial_area["y"],
                    "w": facial_area["w"],
                    "h": facial_area["h"]
                },
                "confidence": confidence,
                "embedding": None # We'll handle embeddings in a separate endpoint or optimized call
            })
            
        return {"faces": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        shutil.rmtree(temp_dir)

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    """Full analysis: detection + embeddings for all faces."""
    temp_dir = tempfile.mkdtemp()
    try:
        file_path = os.path.join(temp_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # DeepFace.represent returns detection + embedding for all faces
        objs = DeepFace.represent(
            img_path=file_path,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=False
        )
        
        results = []
        for obj in objs:
            results.append({
                "box": {
                    "x": obj["facial_area"]["x"],
                    "y": obj["facial_area"]["y"],
                    "w": obj["facial_area"]["w"],
                    "h": obj["facial_area"]["h"]
                },
                "embedding": obj["embedding"],
                "confidence": 1.0 # represent doesn't return raw detection confidence in same way as extract_faces
            })
            
        return {"faces": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        shutil.rmtree(temp_dir)

@app.post("/verify")
async def verify_faces(
    img1: UploadFile = File(...), 
    img2: UploadFile = File(...)
):
    """Verifies if two faces belong to the same person."""
    temp_dir = tempfile.mkdtemp()
    try:
        p1 = os.path.join(temp_dir, "img1.jpg")
        p2 = os.path.join(temp_dir, "img2.jpg")
        
        with open(p1, "wb") as f: shutil.copyfileobj(img1.file, f)
        with open(p2, "wb") as f: shutil.copyfileobj(img2.file, f)
        
        result = DeepFace.verify(
            img1_path=p1, 
            img2_path=p2,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=False
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        shutil.rmtree(temp_dir)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
