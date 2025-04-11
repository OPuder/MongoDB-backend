const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

// Benutzerprofil abrufen
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    res.json(user);
  } catch (error) {
    console.error('Fehler beim Abrufen des Profils:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen des Profils' });
  }
};

// Benutzer-Passwort zurücksetzen
exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Benutzer nicht gefunden' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Passwort erfolgreich zurückgesetzt' });
  } catch (error) {
    console.error('Fehler beim Zurücksetzen des Passworts:', error);
    res.status(500).json({ message: 'Fehler beim Zurücksetzen des Passworts' });
  }
};
