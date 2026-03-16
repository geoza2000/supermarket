import { onRequest } from 'firebase-functions/v2/https';
import type { HealthCheckResponse } from '@supermarket-list/shared';
import { db } from '../admin';
import { HTTPS_CONFIG } from '../config';
import * as fs from 'fs';
import * as path from 'path';

// Read version from package.json at startup
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf-8')
);
const VERSION = packageJson.version;

/**
 * Health check endpoint - GET /healthCheck
 * Public endpoint (no App Check) for load balancers and monitoring.
 */
export const healthCheck = onRequest(HTTPS_CONFIG, async (_req, res) => {
  let firestoreStatus: HealthCheckResponse['firestore'] = {
    status: 'error',
  };

  // Check Firestore health
  const startTime = Date.now();
  try {
    // Perform a simple read operation to verify Firestore connectivity
    await db.collection('_health').doc('ping').get();
    firestoreStatus = {
      status: 'ok',
      latencyMs: Date.now() - startTime,
    };
  } catch (error) {
    firestoreStatus = {
      status: 'error',
      latencyMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  const response: HealthCheckResponse = {
    status: firestoreStatus.status === 'ok' ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    version: VERSION,
    firestore: firestoreStatus,
  };

  res.status(firestoreStatus.status === 'ok' ? 200 : 503).json(response);
});
