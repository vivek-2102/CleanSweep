const rateLimitWindowMs = 60 * 1000; // 1 minute
const maxRequests = 10; // max requests per user per minute

const userRequests = new Map();

function rateLimiter(req, res, next) {
  const userId = req.user ? req.user.id : req.ip; // fallback to IP if not logged in
  const currentTime = Date.now();

  if (!userRequests.has(userId)) {
    userRequests.set(userId, []);
  }

  const timestamps = userRequests.get(userId);

  // remove old requests outside of window
  while (timestamps.length && timestamps[0] <= currentTime - rateLimitWindowMs) {
    timestamps.shift();
  }

  if (timestamps.length >= maxRequests) {
    return res.status(429).json({
      error: 'Too many requests, please try again later.',
    });
  }

  // record new request
  timestamps.push(currentTime);
  userRequests.set(userId, timestamps);

  next();
}

module.exports = rateLimiter;
