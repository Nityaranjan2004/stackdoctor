import os from 'os';

/**
 * Sends the Environment Snapshot to the StackDoctor backend server.
 * @param {Object} snapshot The PC inspection data
 * @param {string} [backendUrl] Backend endpoint URL
 * @returns {Promise<Object>} Backend response
 */
export async function sendEnvironmentSnapshot(snapshot, projectId = null, backendUrl = 'http://localhost:5000/api/scan/environment') {
  try {
    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        os: os.platform(),
        hostname: os.hostname(),
        ...snapshot
      })
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error('Failed to post snapshot to StackDoctor backend:', err.message);
    return null;
  }
}
