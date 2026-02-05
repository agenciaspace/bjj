// Health check / status endpoint
export default function handler(req, res) {
  const isAWSConfigured = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

  res.status(200).json({
    message: 'BJJ Face Recognition API (AWS Rekognition)',
    status: isAWSConfigured ? 'ready' : 'not configured',
    provider: 'AWS Rekognition',
    runtime: 'Node.js Serverless',
    version: '2.0.0',
    endpoints: {
      detect: '/api/detect',
      analyze: '/api/analyze',
      verify: '/api/verify',
    },
    note: isAWSConfigured
      ? 'AWS credentials configured'
      : 'Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION environment variables',
  });
}
