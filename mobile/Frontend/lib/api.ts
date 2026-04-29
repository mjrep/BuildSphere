import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost?.split(':')[0] || '172.20.10.2';

export const API_URL = `http://${localhost}:3001`;



