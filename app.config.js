const { existsSync } = require('fs');

/*
 * Configuration de l'appli : app.json, plus ce qui dépend des fichiers présents.
 * Notifications Android : Firebase (google-services.json). Sur les serveurs de fabrication d'Expo,
 * le fichier est fourni par la variable GOOGLE_SERVICES_JSON ; en local, il est à la racine du
 * projet. Sans lui (développement dans Expo Go), on ne le demande pas.
 */
const LOCAL_GOOGLE_SERVICES = './google-services.json';

module.exports = ({ config }) => {
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON ??
    (existsSync(LOCAL_GOOGLE_SERVICES) ? LOCAL_GOOGLE_SERVICES : undefined);
  return {
    ...config,
    android: { ...config.android, ...(googleServicesFile ? { googleServicesFile } : {}) },
  };
};
