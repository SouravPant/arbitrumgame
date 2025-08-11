export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, data } = req.body;
    
    console.log('Webhook received:', { action, data, timestamp: new Date().toISOString() });
    
    // Handle different webhook actions
    switch (action) {
      case 'game_start':
        console.log('Game started by user');
        break;
      case 'nft_minted':
        console.log('NFT minted:', data);
        break;
      case 'milestone_reached':
        console.log('Milestone reached:', data);
        break;
      default:
        console.log('Unknown action:', action);
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}