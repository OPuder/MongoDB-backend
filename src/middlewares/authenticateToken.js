const jwt = require('jsonwebtoken');

// Middleware zum Überprüfen des Tokens
function authenticateToken(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Zugang verweigert: Kein Token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);  // Überprüft das Token mit deinem geheimen Schlüssel
    req.userId = decoded.userId;  // Benutzer-ID aus dem Token extrahieren
    next();  // Weiter zum nächsten Middleware/Handler
  } catch (error) {
    res.status(401).json({ message: 'Ungültiges Token' });
  }
}

module.exports = authenticateToken;