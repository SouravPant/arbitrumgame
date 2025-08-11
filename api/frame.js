// Farcaster Frame API endpoint
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Handle frame interaction
    const { trustedData, untrustedData } = req.body;
    
    // Log the frame interaction
    console.log('Frame interaction received:', { trustedData, untrustedData });
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'Frame interaction processed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing frame interaction:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}