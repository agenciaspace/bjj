# Quick Start - ONNX Face Recognition API

## Installation

```bash
# From project root
cd api

# Install dependencies
pip install -r pyproject.toml
# or manually:
pip install fastapi uvicorn onnxruntime opencv-python-headless mangum numpy scipy requests
```

## Running Locally

```bash
# Start the API server
python index.py

# Server runs on http://localhost:8000
```

### Test with curl

```bash
# Check status
curl http://localhost:8000/

# Detect faces (upload an image)
curl -X POST -F "file=@path/to/image.jpg" http://localhost:8000/detect

# Analyze image (with embeddings)
curl -X POST -F "file=@path/to/image.jpg" http://localhost:8000/analyze

# Verify two faces match
curl -X POST -F "img1=@face1.jpg" -F "img2=@face2.jpg" http://localhost:8000/verify
```

## API Endpoints

### GET /
Status check
```
Response:
{
  "message": "BJJ Face Recognition API (ONNX Ultra-Light)",
  "status": "ready",
  "detector": "Ultra-Light-Fast-Generic-Face-Detector",
  "recognizer": "ArcFace/MobileFaceNet",
  "framework": "ONNX Runtime CPU"
}
```

### POST /detect
Detect faces in an image
```
Input: Image file
Output: Face coordinates and confidence scores
{
  "faces": [
    {
      "box": {"x": 100, "y": 150, "w": 80, "h": 100},
      "confidence": 0.95,
      "embedding": null
    }
  ],
  "count": 1
}
```

### POST /analyze
Detect faces and extract embeddings
```
Input: Image file
Output: Face coordinates, confidence, and 512-dim embeddings
{
  "faces": [
    {
      "box": {"x": 100, "y": 150, "w": 80, "h": 100},
      "confidence": 0.95,
      "embedding": [0.1, -0.2, ..., 0.5]
    }
  ],
  "count": 1
}
```

### POST /verify
Verify if two faces belong to same person
```
Input: Two image files + optional threshold (0-1)
Output: Verification result and similarity score
{
  "verified": true,
  "distance": 0.35,
  "similarity": 0.65,
  "threshold": 0.5,
  "face1_detected": true,
  "face2_detected": true
}
```

## Models

Models auto-download on first run:
- `ultra_light_detector.onnx` (1.2MB) - Face detection
- `arcface_mobilenet.onnx` (4-5MB) - Face embeddings

Located in: `./models/`

## Key Parameters

### Detection Confidence Threshold
- Default: 0.5
- Range: 0-1
- Lower = more detections (more false positives)
- Higher = fewer detections (fewer false positives)

### Verification Distance Threshold
- Default: 0.5
- Range: 0-1
- Lower = stricter matching (fewer false positives)
- Higher = looser matching (fewer false negatives)

## Performance

- Detection: ~50ms per image
- Embeddings: ~50ms per face
- Verification: ~100ms for two images

## Troubleshooting

**No faces detected?**
- Ensure image has clear frontal faces
- Check image quality (not too dark/blurry)
- Try lowering confidence threshold

**Embeddings are None?**
- Ensure face recognition model is loaded
- Check console for model load errors
- Models download on first request

**Slow responses?**
- First request includes model initialization (2-3 seconds)
- Subsequent requests are cached and fast (~100ms)

## Code Structure

```python
index.py:
  ├── initialize_models()       # Load ONNX models
  ├── detect_faces_onnx()       # Ultra-Light detection
  ├── extract_embedding()       # ArcFace embeddings
  ├── @app.get("/")             # Status endpoint
  ├── @app.post("/detect")      # Detection endpoint
  ├── @app.post("/analyze")     # Detection + embeddings
  └── @app.post("/verify")      # Face verification
```

## Environment Variables

None required. All configuration is in code.

## Deployment

See `ONNX_DEPLOYMENT_GUIDE.md` for Vercel deployment instructions.
