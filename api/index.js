import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { RekognitionClient, DetectFacesCommand, CompareFacesCommand } from '@aws-sdk/client-rekognition';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Enable CORS
app.use(cors());
app.use(express.json());

// Initialize AWS Rekognition client
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Check if AWS is configured
const isAWSConfigured = () => {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
};

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'BJJ Face Recognition API (AWS Rekognition)',
    status: isAWSConfigured() ? 'ready' : 'not configured',
    provider: 'AWS Rekognition',
    runtime: 'Node.js',
    version: '2.0.0',
    note: isAWSConfigured()
      ? 'AWS credentials configured'
      : 'Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION environment variables',
  });
});

// Detect faces endpoint
app.post('/detect', upload.single('file'), async (req, res) => {
  try {
    if (!isAWSConfigured()) {
      return res.status(503).json({
        error: 'AWS Rekognition not configured. Set AWS credentials in environment variables.',
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const command = new DetectFacesCommand({
      Image: { Bytes: req.file.buffer },
      Attributes: ['DEFAULT'],
    });

    const response = await rekognitionClient.send(command);

    const faces = response.FaceDetails.map((face) => ({
      box: {
        left: face.BoundingBox.Left,
        top: face.BoundingBox.Top,
        width: face.BoundingBox.Width,
        height: face.BoundingBox.Height,
      },
      confidence: face.Confidence,
    }));

    res.json({
      faces,
      count: faces.length,
      provider: 'AWS Rekognition',
    });
  } catch (error) {
    console.error('Detection error:', error);
    res.status(500).json({
      error: 'Detection failed',
      message: error.message,
    });
  }
});

// Analyze faces endpoint (with detailed attributes)
app.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!isAWSConfigured()) {
      return res.status(503).json({
        error: 'AWS Rekognition not configured. Set AWS credentials in environment variables.',
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const command = new DetectFacesCommand({
      Image: { Bytes: req.file.buffer },
      Attributes: ['ALL'],
    });

    const response = await rekognitionClient.send(command);

    const faces = response.FaceDetails.map((face) => {
      const emotions = (face.Emotions || [])
        .sort((a, b) => b.Confidence - a.Confidence)
        .slice(0, 3)
        .map((emotion) => ({
          type: emotion.Type,
          confidence: emotion.Confidence,
        }));

      return {
        box: {
          left: face.BoundingBox.Left,
          top: face.BoundingBox.Top,
          width: face.BoundingBox.Width,
          height: face.BoundingBox.Height,
        },
        confidence: face.Confidence,
        age_range: {
          low: face.AgeRange?.Low,
          high: face.AgeRange?.High,
        },
        gender: {
          value: face.Gender?.Value,
          confidence: face.Gender?.Confidence,
        },
        emotions,
        quality: {
          brightness: face.Quality?.Brightness,
          sharpness: face.Quality?.Sharpness,
        },
      };
    });

    res.json({
      faces,
      count: faces.length,
      provider: 'AWS Rekognition',
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message,
    });
  }
});

// Verify faces endpoint
app.post('/verify', upload.fields([{ name: 'img1' }, { name: 'img2' }]), async (req, res) => {
  try {
    if (!isAWSConfigured()) {
      return res.status(503).json({
        error: 'AWS Rekognition not configured. Set AWS credentials in environment variables.',
      });
    }

    if (!req.files?.img1 || !req.files?.img2) {
      return res.status(400).json({ error: 'Two images required: img1 and img2' });
    }

    const threshold = parseFloat(req.body.threshold) || 90.0;

    const command = new CompareFacesCommand({
      SourceImage: { Bytes: req.files.img1[0].buffer },
      TargetImage: { Bytes: req.files.img2[0].buffer },
      SimilarityThreshold: threshold,
    });

    const response = await rekognitionClient.send(command);

    if (!response.FaceMatches || response.FaceMatches.length === 0) {
      return res.json({
        verified: false,
        similarity: 0.0,
        threshold,
        message: 'Faces do not match or no faces detected',
        face1_detected: !!response.SourceImageFace,
        face2_detected: response.UnmatchedFaces?.length > 0,
        provider: 'AWS Rekognition',
      });
    }

    const bestMatch = response.FaceMatches[0];

    res.json({
      verified: bestMatch.Similarity >= threshold,
      similarity: bestMatch.Similarity,
      threshold,
      face1_detected: true,
      face2_detected: true,
      bounding_box: {
        left: bestMatch.Face.BoundingBox.Left,
        top: bestMatch.Face.BoundingBox.Top,
        width: bestMatch.Face.BoundingBox.Width,
        height: bestMatch.Face.BoundingBox.Height,
      },
      confidence: bestMatch.Face.Confidence,
      provider: 'AWS Rekognition',
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      error: 'Verification failed',
      message: error.message,
    });
  }
});

// Vercel serverless function handler
export default (req, res) => {
  // Set base path to empty since Vercel handles /api routing
  return app(req, res);
};

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
