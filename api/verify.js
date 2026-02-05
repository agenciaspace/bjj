import { RekognitionClient, CompareFacesCommand } from '@aws-sdk/client-rekognition';

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

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!isAWSConfigured()) {
      return res.status(503).json({
        error: 'AWS Rekognition not configured. Set AWS credentials in environment variables.',
      });
    }

    // For Vercel serverless, we need to handle multipart form data differently
    const contentType = req.headers['content-type'] || '';

    let image1Buffer, image2Buffer, threshold;

    if (contentType.includes('multipart/form-data')) {
      // Parse multipart form data
      const formidable = await import('formidable');
      const form = formidable.default({ multiples: true });

      const [fields, files] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      });

      const img1 = files.img1?.[0] || files.img1;
      const img2 = files.img2?.[0] || files.img2;

      if (!img1 || !img2) {
        return res.status(400).json({ error: 'Two images required: img1 and img2' });
      }

      const fs = await import('fs');
      image1Buffer = fs.readFileSync(img1.filepath);
      image2Buffer = fs.readFileSync(img2.filepath);

      threshold = parseFloat(fields.threshold?.[0] || fields.threshold || 90.0);
    } else if (contentType.includes('application/json')) {
      // Handle base64-encoded images in JSON
      if (!req.body || !req.body.image1 || !req.body.image2) {
        return res.status(400).json({ error: 'Two images required: image1 and image2' });
      }
      image1Buffer = Buffer.from(req.body.image1, 'base64');
      image2Buffer = Buffer.from(req.body.image2, 'base64');
      threshold = parseFloat(req.body.threshold || 90.0);
    } else {
      return res.status(400).json({ error: 'Unsupported content type' });
    }

    const command = new CompareFacesCommand({
      SourceImage: { Bytes: image1Buffer },
      TargetImage: { Bytes: image2Buffer },
      SimilarityThreshold: threshold,
    });

    const response = await rekognitionClient.send(command);

    if (!response.FaceMatches || response.FaceMatches.length === 0) {
      return res.status(200).json({
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

    res.status(200).json({
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
}
