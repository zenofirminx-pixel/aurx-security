// config/rules.js

/**
 * AURX SECURITY RULES
 * Tous les seuils et comportements sont centralisés ici
 */

export const RULES = {
  // ⏱ fenêtre d'analyse (tracker)
  TIME_WINDOW_MS: 10000, // 10 secondes

  // 📊 seuils de requêtes
  THRESHOLDS: {
    NORMAL_MAX: 8,
    SUSPECT_MAX: 15,
    ABUSE_MAX: 22,
    BLOCK_MIN: 23,
  },

  // 🚨 cooldowns
  COOLDOWN: {
    SUSPECT: 0, // pas de blocage
    ABUSE: 60 * 1000, // 1 minute
    BLOCK: 5 * 60 * 1000, // 5 minutes
    ESCALATION_MULTIPLIER: 2, // récidive
  },

  // 🧠 comportement vitesse
  SPEED: {
    FAST_INTERVAL_MS: 150, // si <150ms = comportement suspect
    BURST_MIN_COUNT: 10, // burst rapide
  },

  // 🧠 mémoire long terme
  MEMORY: {
    MAX_INACTIVE_TIME_MS: 60 * 60 * 1000, // 1 heure
    ABUSE_SCORE_INCREMENT: {
      SUSPECT: 0.5,
      ABUSE: 1,
      BLOCK: 2,
    },
    RECIDIVE_BLOCKS: 3, // après 3 blocks → sanction forte
  },

  // 🛡 sécurité générale
  SECURITY: {
    ENABLE_RATE_LIMIT: true,
    ENABLE_BURST_DETECTION: true,
    ENABLE_LONG_TERM_MEMORY: true,
  },
};