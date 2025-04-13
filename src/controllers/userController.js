const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

exports.updateProfile = async (req, res) => {
  const { password, confirmPassword, vorname, nachname, spitzname, email, role, securityQuestion, securityAnswer } = req.body;

  if (password && password !== confirmPassword) {
    return res.status(400).json({ message: 'Die Passwörter stimmen nicht überein' });
  }

  if (password) {
    req.body.password = await bcrypt.hash(password, 10);
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(req.userId, {
      vorname: vorname || undefined,
      nachname: nachname || undefined,
      spitzname: spitzname || undefined,
      email: email || undefined,
      role: role || undefined,
      securityQuestion: securityQuestion || undefined,
      securityAnswer: securityAnswer ? await bcrypt.hash(securityAnswer, 10) : undefined,
      password: req.body.password || undefined,
    }, {
      new: true,
    }).select("-password"); 

    if (!updatedUser) {
      return res.status(404).json({ message: "Benutzer nicht gefunden" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Profils:", error);
    res.status(500).json({ message: "Fehler beim Aktualisieren des Profils" });
  }
};

exports.checkEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user) {
      return res
        .status(200)
        .json({ message: "E-Mail existiert", exists: true });
    } else {
      return res
        .status(404)
        .json({ message: "E-Mail existiert nicht", exists: false });
    }
  } catch (error) {
    console.error("Fehler bei der E-Mail-Prüfung:", error);
    res.status(500).json({ message: "Fehler beim Überprüfen der E-Mail" });
  }
};

exports.verifySecurityAnswer = async (req, res) => {
  const { email, securityAnswer } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Benutzer nicht gefunden" });
    }

    const isAnswerCorrect = await bcrypt.compare(
      securityAnswer,
      user.securityAnswer
    );

    if (isAnswerCorrect) {
      return res.status(200).json({ valid: true });
    } else {
      return res
        .status(400)
        .json({
          valid: false,
          message: "Falsche Antwort auf die Sicherheitsfrage",
        });
    }
  } catch (error) {
    console.error("Fehler bei der Überprüfung der Sicherheitsantwort:", error);
    res
      .status(500)
      .json({ message: "Fehler bei der Überprüfung der Sicherheitsantwort" });
  }
};

exports.getSecurityQuestion = async (req, res) => {
  const { email } = req.query;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Benutzer nicht gefunden" });
    }

    res.status(200).json({ question: user.securityQuestion });
  } catch (error) {
    console.error("Fehler beim Abrufen der Sicherheitsfrage:", error);
    res
      .status(500)
      .json({ message: "Fehler beim Abrufen der Sicherheitsfrage" });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "Benutzer nicht gefunden" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Passwort erfolgreich zurückgesetzt" });
  } catch (error) {
    console.error("Fehler beim Zurücksetzen des Passworts:", error);
    res.status(500).json({ message: "Fehler beim Zurücksetzen des Passworts" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Zugriff nur für Admins erlaubt" });
    }

    const users = await User.find({}).select("-password -securityAnswer");

    res.status(200).json(users);
  } catch (error) {
    console.error("Fehler beim Abrufen der Benutzer:", error);
    res.status(500).json({ message: "Fehler beim Abrufen der Benutzer" });
  }
};