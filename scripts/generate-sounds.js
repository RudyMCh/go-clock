#!/usr/bin/env node
/**
 * Génère des fichiers WAV simples pour les alertes sonores de l'horloge.
 * Usage : node scripts/generate-sounds.js
 */

const fs = require('fs');
const path = require('path');

function writeWav(filename, frequency, durationSec, amplitude = 0.7) {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // En-tête RIFF/WAVE
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);        // taille du chunk fmt
  buffer.writeUInt16LE(1, 20);         // format PCM
  buffer.writeUInt16LE(1, 22);         // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // octets/seconde
  buffer.writeUInt16LE(2, 32);         // bloc align
  buffer.writeUInt16LE(16, 34);        // bits/sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  // Génère une onde sinusoïdale avec enveloppe d'attaque/relâche
  const attackSamples = Math.floor(sampleRate * 0.01);
  const releaseSamples = Math.floor(sampleRate * 0.03);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let env = 1.0;
    if (i < attackSamples) env = i / attackSamples;
    else if (i > numSamples - releaseSamples) env = (numSamples - i) / releaseSamples;

    const sample = Math.floor(env * amplitude * 32767 * Math.sin(2 * Math.PI * frequency * t));
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, sample)), 44 + i * 2);
  }

  fs.writeFileSync(filename, buffer);
  console.log(`✓ ${path.basename(filename)} (${frequency}Hz, ${durationSec}s)`);
}

const outDir = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(outDir, { recursive: true });

// Bip court grave  — dernières 10-6 secondes (byoyomi / canadien / absolu)
writeWav(path.join(outDir, 'beep.wav'), 880, 0.12);

// Bip court aigu  — dernières 5 secondes (urgence)
writeWav(path.join(outDir, 'beep_urgent.wav'), 1320, 0.12);

// Alarme          — fin du temps
writeWav(path.join(outDir, 'alarm.wav'), 440, 1.2, 0.9);

console.log('\nFichiers générés dans assets/sounds/');
