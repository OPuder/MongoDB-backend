const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

// Middleware zum Überprüfen der Sicherheitsantwort
const verifySecurityAnswer = async (req, res, next) => {
  const { email, securityAnswer } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    const isMatch = await bcrypt.compare(securityAnswer, user.securityAnswer);
    if (!isMatch) {
      return res.status(400).json({ message: 'Die Sicherheitsantwort stimmt nicht überein' });
    }

    // Wenn die Antwort korrekt ist, fahre mit der nächsten Middleware fort
    next();
  } catch (error) {
    console.error('Fehler beim Überprüfen der Sicherheitsantwort:', error);
    return res.status(500).json({ message: 'Fehler bei der Überprüfung der Sicherheitsantwort' });
  }
};

module.exports = verifySecurityAnswer;
