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
// Benutzerprofil abrufen
exports.updateProfile = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.userId, req.body, { new: true }).select('-password');
    if (!updatedUser) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }
    res.json(updatedUser);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Profils:', error);
    res.status(500).json({ message: 'Fehler beim Aktualisieren des Profils' });
  }
};

// Funktion, um zu überprüfen, ob die E-Mail existiertexports.checkEmail = async (req, res) => {
  exports.checkEmail = async (req, res) => {
    const { email } = req.body;  // Wir erwarten die E-Mail im Request-Body
  
    try {
      // Überprüfen, ob die E-Mail im System existiert
      const user = await User.findOne({ email });
  
      if (user) {
        // Wenn der Benutzer mit der E-Mail existiert
        return res.status(200).json({ message: 'E-Mail existiert', exists: true });
      } else {
        // Wenn der Benutzer mit der E-Mail nicht existiert
        return res.status(404).json({ message: 'E-Mail existiert nicht', exists: false });
      }
    } catch (error) {
      console.error('Fehler bei der E-Mail-Prüfung:', error);
      res.status(500).json({ message: 'Fehler beim Überprüfen der E-Mail' });
    }
  };


// Deine Controller-Funktion zum Überprüfen der Sicherheitsantwort
exports.verifySecurityAnswer = async (req, res) => {
  const { email, securityAnswer } = req.body;

  try {
    // Benutzer anhand der E-Mail finden
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    // Vergleiche die gehashte Antwort mit der eingegebenen Antwort
    const isAnswerCorrect = await bcrypt.compare(securityAnswer, user.securityAnswer);

    // Wenn die Antwort korrekt ist
    if (isAnswerCorrect) {
      return res.status(200).json({ valid: true });
    } else {
      return res.status(400).json({ valid: false, message: 'Falsche Antwort auf die Sicherheitsfrage' });
    }
  } catch (error) {
    console.error('Fehler bei der Überprüfung der Sicherheitsantwort:', error);
    res.status(500).json({ message: 'Fehler bei der Überprüfung der Sicherheitsantwort' });
  }
};

// Sicherheitsfrage abrufen
exports.getSecurityQuestion = async (req, res) => {
  const { email } = req.query;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    // Gebe die Sicherheitsfrage zurück
    res.status(200).json({ question: user.securityQuestion });
  } catch (error) {
    console.error('Fehler beim Abrufen der Sicherheitsfrage:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Sicherheitsfrage' });
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
