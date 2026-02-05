export default function handler(req, res) {
  res.status(200).json({
    message: 'Hello from Vercel serverless function!',
    method: req.method,
    path: req.url,
  });
}
