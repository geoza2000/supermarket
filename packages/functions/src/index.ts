import * as dotenv from 'dotenv';
dotenv.config();

import './admin';

// Callable (onCall)
export { getUserDetails } from './callable/getUserDetails';
export { manageFcmToken } from './callable/manageFcmToken';
export { sendTestNotification } from './callable/sendTestNotification';

// HTTP (onRequest)
export { healthCheck } from './https/healthCheck';
