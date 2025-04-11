const bcrypt = require("bcryptjs");
const User = require("./userModel"); // Achte darauf, dass das User-Modell korrekt importiert wird

// Funktion zum Erstellen des Standard-Admins
async function createDefaultAdmin() {
  try {
    const adminExists = await User.findOne({ role: "admin" });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10); // Standardpasswort

      const admin = new User({
        vorname: "Admin",
        nachname: "Admin",
        spitzname: "Admin123",
        email: "admin@admin.de",
        password: hashedPassword,
        role: "admin",
        securityQuestion: "Wer bist du? admin",
        securityAnswer: "admin",
      });

      await admin.save();
      console.log("Standard-Admin wurde erstellt!");
    } else {
      console.log("Admin-Benutzer existiert bereits.");
    }
  } catch (error) {
    console.error("Fehler beim Erstellen des Standard-Admins:", error);
  }
}

// Exportiere die Funktion
module.exports = { createDefaultAdmin };
