export const environment = {
  production: true,
  // Le front est servi par le même nginx que l'API : même origine,
  // donc pas de préflight CORS et un seul certificat à gérer.
  apiUrl: 'https://gchess.sur-le-web.fr',
  wsUrl: 'wss://gchess.sur-le-web.fr',
  wsProtocol: 'wss' as const,
  reconnectMaxAttempts: 10,
  reconnectBaseDelay: 1000,
  reconnectMaxDelay: 16000
};
