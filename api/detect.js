import { RekognitionClient, DetectFacesCommand } from '@aws-sdk/client-rekognition';

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
    // The body will contain the base64-encoded image or we'll get it from the request
    const contentType = req.headers['content-type'] || '';

    let imageBuffer;

    if (contentType.includes('multipart/form-data')) {
      // Parse multipart form data
      const formidable = await import('formidable');
      const form = formidable.default({ multiples: false });

      const [fields, files] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      });

      const file = files.file?.[0] || files.file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fs = await import('fs');
      imageBuffer = fs.readFileSync(file.filepath);
    } else if (contentType.includes('application/json')) {
      // Handle base64-encoded image in JSON
      if (!req.body || !req.body.image) {
        return res.status(400).json({ error: 'No image data provided' });
      }
      imageBuffer = Buffer.from(req.body.image, 'base64');
    } else {
      // Handle raw binary data
      imageBuffer = req.body;
    }

    const command = new DetectFacesCommand({
      Image: { Bytes: imageBuffer },
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

    res.status(200).json({
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
}
