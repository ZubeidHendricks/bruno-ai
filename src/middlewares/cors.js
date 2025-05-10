// CORS middleware
module.exports = function(req, res, next) {
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Log CORS request
  console.log(`CORS middleware - ${req.method} request from origin: ${req.headers.origin || 'unknown'}`);
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request with CORS middleware');
    return res.status(200).end();
  }
  
  next();
};