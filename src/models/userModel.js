const mongoose = require('mongoose');

// Überprüfen, ob das Modell bereits existiert, um den Fehler zu vermeiden
const userSchema = new mongoose.Schema({
  vorname: { type: String, required: true },
  nachname: { type: String, required: true },
  spitzname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user', 'banned'], default: 'user' },
  securityQuestion: { type: String, required: true },
  securityAnswer: { type: String, required: true },
});

// Wenn das Modell bereits existiert, wird es nicht neu definiert
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
