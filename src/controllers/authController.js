const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'E-Mail und Passwort sind erforderlich' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Benutzer nicht gefunden' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Falsches Passwort' });

    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
    res.json({ access_token: token, refresh_token: process.env.JWT_REFRESH_SECRET_KEY });
  } catch (error) {
    console.error('Fehler beim Login:', error);
    res.status(500).json({ message: 'Fehler beim Login. Bitte versuchen Sie es später erneut.' });
  }
};

// Registration
exports.register = async (req, res) => {
  const { vorname, nachname, spitzname, email, password, role, securityQuestion, securityAnswer } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).send('Benutzer existiert bereits.');

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedSecurityAnswer = await bcrypt.hash(securityAnswer, 10);

    const newUser = new User({
      vorname,
      nachname,
      spitzname,
      email,
      password: hashedPassword,
      role,
      securityQuestion,
      securityAnswer: hashedSecurityAnswer,
    });

    await newUser.save();

    const token = jwt.sign({ userId: newUser._id, email: newUser.email }, process.env.JWT_SECRET_KEY, { expiresIn: '7d' });
    const refreshToken = jwt.sign({ userId: newUser._id }, process.env.JWT_REFRESH_SECRET_KEY, { expiresIn: '7d' });

    res.status(201).json({ message: 'Benutzer erfolgreich registriert', token: token, refresh_token: refreshToken });
  } catch (error) {
    console.error('Fehler bei der Registrierung:', error);
    res.status(500).json({ message: 'Fehler bei der Registrierung. Bitte versuche es später erneut.' });
  }
};
