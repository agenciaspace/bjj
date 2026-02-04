import os
import base64
import numpy as np
import cv2
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from insightface.app import FaceAnalysis
from typing import List, Optional
import uvicorn
import shutil
import tempfile
from scipy.spatial.distance import cosine

# Initialize FastAPI app
app = FastAPI(title="BJJ Face Recognition API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize InsightFace model (using ONNX Runtime)
# Using CPU execution provider for Vercel compatibility
try:
    face_app = FaceAnalysis(providers=['CPUExecutionProvider'])
    face_app.prepare(ctx_id=0, det_size=(640, 640))
except Exception as e:
    print(f"Warning: Could not initialize FaceAnalysis: {e}")
    face_app = None

@app.get("/")
async def root():
    status = "ready" if face_app is not None else "not initialized"
    return {
        "message": "BJJ Face Recognition API (InsightFace + ONNX)",
        "status": status,
        "framework": "InsightFace",
        "detector": "SCRFD"
    }

@app.post("/detect")
async def detect_faces(file: UploadFile = File(...)):
    """Detects all faces in an image and returns their coordinates."""
    if face_app is None:
        raise HTTPException(status_code=503, detail="Face detection model not initialized")

    temp_dir = tempfile.mkdtemp()
    try:
        file_path = os.path.join(temp_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Read image using OpenCV
        img = cv2.imread(file_path)
        if img is None:
            raise HTTPException(status_code=400, detail="Could not read image file")

        # Detect faces using InsightFace
        faces = face_app.get(img)

        results = []
        for face in faces:
            # Convert numpy arrays to lists for JSON serialization
            bbox = face.bbox.astype(int).tolist()

            results.append({
                "box": {
                    "x": int(bbox[0]),
                    "y": int(bbox[1]),
                    "w": int(bbox[2] - bbox[0]),
                    "h": int(bbox[3] - bbox[1])
                },
                "confidence": float(face.det_score),
                "embedding": face.embedding.tolist() if hasattr(face, 'embedding') else None
            })

        return {"faces": results, "count": len(results)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection error: {str(e)}")
    finally:
        shutil.rmtree(temp_dir)

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    """Full analysis: detection + embeddings for all faces."""
    if face_app is None:
        raise HTTPException(status_code=503, detail="Face detection model not initialized")

    temp_dir = tempfile.mkdtemp()
    try:
        file_path = os.path.join(temp_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Read image
        img = cv2.imread(file_path)
        if img is None:
            raise HTTPException(status_code=400, detail="Could not read image file")

        # Detect and extract embeddings
        faces = face_app.get(img)

        results = []
        for face in faces:
            bbox = face.bbox.astype(int).tolist()

            results.append({
                "box": {
                    "x": int(bbox[0]),
                    "y": int(bbox[1]),
                    "w": int(bbox[2] - bbox[0]),
                    "h": int(bbox[3] - bbox[1])
                },
                "confidence": float(face.det_score),
                "embedding": face.embedding.tolist(),
                "age": float(face.age) if hasattr(face, 'age') else None,
                "gender": int(face.gender) if hasattr(face, 'gender') else None  # 0=female, 1=male
            })

        return {"faces": results, "count": len(results)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")
    finally:
        shutil.rmtree(temp_dir)

@app.post("/verify")
async def verify_faces(
    img1: UploadFile = File(...),
    img2: UploadFile = File(...),
    threshold: Optional[float] = 0.5
):
    """Verifies if two faces belong to the same person using embedding comparison."""
    if face_app is None:
        raise HTTPException(status_code=503, detail="Face detection model not initialized")

    temp_dir = tempfile.mkdtemp()
    try:
        p1 = os.path.join(temp_dir, "img1.jpg")
        p2 = os.path.join(temp_dir, "img2.jpg")

        with open(p1, "wb") as f:
            shutil.copyfileobj(img1.file, f)
        with open(p2, "wb") as f:
            shutil.copyfileobj(img2.file, f)

        # Read images
        image1 = cv2.imread(p1)
        image2 = cv2.imread(p2)

        if image1 is None or image2 is None:
            raise HTTPException(status_code=400, detail="Could not read image files")

        # Detect faces and extract embeddings
        faces1 = face_app.get(image1)
        faces2 = face_app.get(image2)

        if len(faces1) == 0 or len(faces2) == 0:
            return {
                "verified": False,
                "distance": 1.0,
                "similarity": 0.0,
                "message": "No faces detected in one or both images"
            }

        # Use first face from each image
        # (In production, you might want to match the closest faces)
        embedding1 = faces1[0].embedding
        embedding2 = faces2[0].embedding

        # Calculate cosine distance and similarity
        distance = cosine(embedding1, embedding2)
        similarity = 1.0 - distance

        # Default threshold: 0.5 (cosine distance)
        # Lower distance = more similar
        verified = distance < threshold

        return {
            "verified": bool(verified),
            "distance": float(distance),
            "similarity": float(similarity),
            "threshold": threshold,
            "face1_detected": len(faces1) > 0,
            "face2_detected": len(faces2) > 0
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification error: {str(e)}")
    finally:
        shutil.rmtree(temp_dir)

# For Vercel deployment
import asyncio
from mangum import Mangum

# Add timeout configuration for Vercel
handler = Mangum(app, lifespan="off")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
