const bcrypt = require("bcryptjs");
const User = require("./userModel");

async function createDefaultAdmin() {
  try {
    const adminExists = await User.findOne({ role: "admin" });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const hashedSecurityAnswer = await bcrypt.hash("admin", 10);

      const admin = new User({
        vorname: "Admin",
        nachname: "Admin",
        spitzname: "Admin123",
        email: "admin@admin.de",
        password: hashedPassword,
        role: "admin",
        securityQuestion: "Wer bist du? admin",
        securityAnswer: hashedSecurityAnswer,
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

module.exports = { createDefaultAdmin };
