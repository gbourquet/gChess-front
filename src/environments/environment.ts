export const environment = {
  production: true,
  apiUrl: 'https://shimmering-spirit-production.up.railway.app',
  wsUrl: 'wss://shimmering-spirit-production.up.railway.app',
  wsProtocol: 'wss' as const,
  reconnectMaxAttempts: 10,
  reconnectBaseDelay: 1000,
  reconnectMaxDelay: 16000
};
