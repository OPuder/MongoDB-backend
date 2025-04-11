require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const authenticateToken = require("./authenticateToken");

const app = express();
const port = 5000;

app.use(express.json());

// Erlaubt Anfragen von deinem Frontend auf localhost:4200
app.use(
  cors({
    origin: "http://localhost:4200",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// MongoDB Schema und Modell für Benutzer
const userSchema = new mongoose.Schema({
  vorname: { type: String, required: true },
  nachname: { type: String, required: true },
  spitzname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "user", "banned"], default: "user" },
  securityQuestion: { type: String, required: true },
  securityAnswer: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// MongoDB-Verbindung
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Datenbank verbunden"))
  .catch((err) => console.log("Fehler bei der Verbindung zu MongoDB:", err));

// Importiere die Funktion zum Erstellen des Standard-Admins
const { createDefaultAdmin } = require("./adminSetup");

// Erstelle den Standard-Admin, falls noch nicht vorhanden
createDefaultAdmin().catch((error) =>
  console.error("Fehler beim Erstellen des Admins:", error)
);

// POST: Benutzer anmelden (Login)
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "E-Mail und Passwort sind erforderlich" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Benutzer nicht gefunden" }); // 401 für nicht authentifizierte Benutzer
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Falsches Passwort" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({
      access_token: token,
      refresh_token: process.env.JWT_REFRESH_SECRET_KEY,
    });
  } catch (error) {
    console.error("Fehler beim Login:", error);
    res.status(500).json({
      message: "Fehler beim Login. Bitte versuchen Sie es später erneut.",
    });
  }
});

// POST: Benutzer registrieren
app.post("/api/register", async (req, res) => {
  // Extrahieren der Felder aus dem Request-Body
  const {
    vorname,
    nachname,
    spitzname,
    email,
    password,
    role,
    securityQuestion,
    securityAnswer,
  } = req.body;

  try {
    // Überprüfen, ob der Benutzer bereits existiert
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("Benutzer existiert bereits.");
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);

    // Neuen Benutzer erstellen
    const newUser = new User({
      vorname,
      nachname,
      spitzname,
      email,
      password: hashedPassword,
      role, // Hier wird die Rolle gesetzt (user/admin)
      securityQuestion,
      securityAnswer,
    });

    // Benutzer speichern
    await newUser.save();

    // JWT-Token erstellen
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    // Refresh-Token erstellen
    const refreshToken = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_REFRESH_SECRET_KEY,
      { expiresIn: "7d" }
    );

    res
      .status(201)
      .json({
        message: "Benutzer erfolgreich registriert",
        token: token,
        refresh_token: process.env.JWT_REFRESH_SECRET_KEY,
      });
  } catch (error) {
    console.error("Fehler bei der Registrierung:", error);
    res
      .status(500)
      .json({
        message:
          "Fehler bei der Registrierung. Bitte versuche es später erneut.",
      });
  }
});

// Endpoint für das Erneuern des Tokens
app.post("/api/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).send("Kein Refresh-Token vorhanden");
  }

  try {
    // Überprüfe den Refresh-Token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET_KEY
    ); // Verwende den geheimen Refresh-Token-Schlüssel

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).send("Benutzer nicht gefunden");
    }

    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET_KEY, // Verwende den geheimen Schlüssel für das neue Access-Token
      { expiresIn: "1h" }
    );

    const newRefreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.json({ access_token: accessToken, refresh_token: newRefreshToken });
  } catch (error) {
    console.error("Fehler beim Erneuern des Tokens:", error);
    res.status(500).send("Fehler beim Erneuern des Tokens");
  }
});

// GET: Benutzerdaten abrufen (nur mit gültigem Token)
app.get("/api/user", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId; // Benutzer-ID aus dem JWT-Token

    // Benutzer aus der Datenbank abrufen, ohne das Passwort zurückzugeben
    const user = await User.findById(userId).select("-password"); // Passwort nicht zurückgeben

    if (!user) {
      return res.status(404).json({ message: "Benutzer nicht gefunden" });
    }

    // Benutzerprofil zurückgeben
    res.json(user);
  } catch (error) {
    console.error("Fehler beim Abrufen des Benutzers:", error);
    res.status(500).json({ message: "Fehler beim Abrufen der Benutzerdaten" });
  }
});

// GET: Benutzerprofil abrufen
app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId); // Hole den Benutzer anhand der userId im Token
    if (!user) {
      return res.status(404).send("Benutzer nicht gefunden");
    }
    res.status(200).send(user); // Gib die Benutzerdaten zurück
  } catch (error) {
    console.error("Fehler beim Abrufen des Profils:", error);
    res.status(500).send("Fehler beim Abrufen des Profils");
  }
});

// PUT: Benutzerdaten aktualisieren
app.put("/api/user", authenticateToken, async (req, res) => {
  const { vorname, nachname, spitzname, email } = req.body;

  try {
    const userId = req.userId; // Benutzer-ID aus dem JWT
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { vorname, nachname, spitzname, email },
      { new: true, runValidators: true } // Gibt das aktualisierte Dokument zurück
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Benutzer nicht gefunden" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Benutzers:", error);
    res
      .status(500)
      .json({ message: "Fehler beim Aktualisieren der Benutzerdaten" });
  }
});

// DELETE: Benutzer löschen
app.delete("/api/user", authenticateToken, async (req, res) => {
  const userId = req.userId; // Benutzer-ID aus dem JWT

  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "Benutzer nicht gefunden" });
    }
    res.json({ message: "Benutzer erfolgreich gelöscht" });
  } catch (error) {
    console.error("Fehler beim Löschen des Benutzers:", error);
    res.status(500).json({ message: "Fehler beim Löschen des Benutzers" });
  }
});

// PUT: Benutzerrolle ändern (nur Admin)
app.put("/api/user/role", authenticateToken, async (req, res) => {
  const { email, role } = req.body;

  try {
    // Überprüfe, ob der Anfragende ein Admin ist
    const requestingUser = await User.findById(req.userId);
    if (requestingUser.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Zugang verweigert: Sie sind kein Administrator" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Benutzer nicht gefunden" });
    }

    user.role = role; // Rolle aktualisieren
    await user.save();
    res.json({ message: `Benutzerrolle für ${email} erfolgreich geändert` });
  } catch (error) {
    console.error("Fehler beim Ändern der Benutzerrolle:", error);
    res.status(500).json({ message: "Fehler beim Ändern der Benutzerrolle" });
  }
});

app.post("/api/check-email", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (user) {
    return res.status(200).json({ exists: true });
  } else {
    return res.status(404).json({ exists: false });
  }
});

app.post("/api/verify-security-answer", async (req, res) => {
  const { email, securityAnswer } = req.body;

  const user = await User.findOne({ email });
  if (user && user.securityAnswer === securityAnswer) {
    return res.status(200).json({ valid: true });
  } else {
    return res.status(400).json({ valid: false });
  }
});

app.post("/api/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "Benutzer nicht gefunden" });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.status(200).json({ message: "Passwort erfolgreich zurückgesetzt" });
});

// Deine Routen hier...
app.listen(process.env.PORT, () => {
  console.log(`Server läuft auf http://localhost:${process.env.PORT}`);
});
