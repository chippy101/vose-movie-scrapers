/**
 * Connection Test Service
 * Verifies backend connectivity on app startup
 */

import { backendApi } from './backendApi';

export interface ConnectionTestResult {
  success: boolean;
  url: string;
  message: string;
  details?: string;
  timestamp: Date;
}

export class ConnectionTestService {
  private static lastTest: ConnectionTestResult | null = null;

  /**
   * Test backend connection
   */
  static async testConnection(): Promise<ConnectionTestResult> {
    const url = backendApi.getBackendUrl();
    const timestamp = new Date();

    console.log('═══════════════════════════════════════════════');
    console.log('[ConnectionTest] 🔍 Testing backend connection...');
    console.log('[ConnectionTest] URL:', url);
    console.log('═══════════════════════════════════════════════');

    try {
      // Test with a short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${url}/health`, {
        signal: controller.signal,
        method: 'GET',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const result: ConnectionTestResult = {
          success: false,
          url,
          message: `Backend returned error: ${response.status}`,
          details: `HTTP ${response.status} ${response.statusText}`,
          timestamp,
        };
        console.error('[ConnectionTest] ❌ FAILED:', result.message);
        this.lastTest = result;
        return result;
      }

      const data = await response.json();

      const result: ConnectionTestResult = {
        success: true,
        url,
        message: 'Backend connection successful',
        details: `Service: ${data.service || 'unknown'}, Status: ${data.status || 'ok'}`,
        timestamp,
      };

      console.log('[ConnectionTest] ✅ SUCCESS');
      console.log('[ConnectionTest] Details:', result.details);
      console.log('═══════════════════════════════════════════════');

      this.lastTest = result;
      return result;

    } catch (error: any) {
      let message = 'Connection failed';
      let details = '';

      if (error.name === 'AbortError') {
        message = 'Connection timeout (10s)';
        details = 'The backend server is not responding. Please check if it\'s running.';
      } else if (error.message?.includes('Network request failed')) {
        message = 'Network error';
        details = 'Unable to reach the backend. Check if you\'re on the correct WiFi network.';
      } else {
        message = 'Unknown error';
        details = error.message || String(error);
      }

      const result: ConnectionTestResult = {
        success: false,
        url,
        message,
        details,
        timestamp,
      };

      console.error('[ConnectionTest] ❌ FAILED');
      console.error('[ConnectionTest] Error:', message);
      console.error('[ConnectionTest] Details:', details);
      console.error('[ConnectionTest] Raw error:', error);
      console.log('═══════════════════════════════════════════════');

      this.lastTest = result;
      return result;
    }
  }

  /**
   * Get last test result
   */
  static getLastTest(): ConnectionTestResult | null {
    return this.lastTest;
  }

  /**
   * Test and return user-friendly error message
   */
  static async testAndGetErrorMessage(): Promise<string | null> {
    const result = await this.testConnection();

    if (result.success) {
      return null;
    }

    return `${result.message}\n\n${result.details}\n\nBackend URL: ${result.url}`;
  }
}
