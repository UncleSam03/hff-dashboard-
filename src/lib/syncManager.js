import { getPendingSubmissions, markAsSynced } from './offlineStorage';
import { hffFetch } from './api';

let isSyncing = false;
let isActuallyOnline = navigator.onLine;

/**
 * Checks for true connectivity by pinging the health endpoint.
 */
export async function checkConnectivity() {
    const previousStatus = isActuallyOnline;
    try {
        const start = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const resp = await hffFetch('/api/health', {
            method: 'GET',
            signal: controller.signal,
            cache: 'no-store'
        });

        clearTimeout(timeoutId);
        isActuallyOnline = resp.ok;
    } catch (e) {
        isActuallyOnline = false;
    }

    if (isActuallyOnline !== previousStatus) {
        console.log(`[SyncManager] Connectivity status changed: ${isActuallyOnline ? 'ONLINE' : 'OFFLINE'}`);
        window.dispatchEvent(new CustomEvent('hff-connectivity-status', { detail: { online: isActuallyOnline } }));

        // If we just came back online, trigger an immediate sync
        if (isActuallyOnline) {
            syncSubmissions();
        }
    }

    return isActuallyOnline;
}

/**
 * Attempts to sync all pending submissions to the backend.
 */
export async function syncSubmissions() {
    if (isSyncing) return;

    const pending = await getPendingSubmissions();
    if (pending.length === 0) return;

    // Check true connectivity before attempting sync
    const online = await checkConnectivity();
    if (!online) return;

    isSyncing = true;
    console.log(`[SyncManager] Attempting to sync ${pending.length} submissions...`);

    try {
        for (const submission of pending) {
            try {
                console.log(`[SyncManager] Syncing submission ${submission.uuid}...`);
                const resp = await hffFetch('/api/submissions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ xml: submission.modelXml }),
                });

                if (resp.ok) {
                    await markAsSynced(submission.id);
                    window.dispatchEvent(new CustomEvent('hff-sync-complete', { detail: { uuid: submission.uuid } }));
                    console.log(`[SyncManager] Synced submission ${submission.uuid} successfully.`);
                } else {
                    const errorText = await resp.text();
                    console.error(`[SyncManager] Failed to sync ${submission.uuid}: Server responded with ${resp.status}: ${errorText}`);
                }
            } catch (e) {
                console.error(`[SyncManager] Network error syncing ${submission.uuid}:`, e);
                isActuallyOnline = false;
                window.dispatchEvent(new CustomEvent('hff-connectivity-status', { detail: { online: false } }));
                break;
            }
        }
    } finally {
        isSyncing = false;
        console.log('[SyncManager] Sync cycle finished.');
    }
}


/**
 * Starts the background sync interval.
 */
export function startAutoSync(syncIntervalMs = 30000, heartbeatIntervalMs = 15000) {
    // Initial checks
    checkConnectivity();
    syncSubmissions();

    // Listen for browser online status as a prompt to check true connectivity
    window.addEventListener('online', () => {
        console.log('[SyncManager] Browser reports online, checking true connectivity...');
        checkConnectivity();
    });

    window.addEventListener('offline', () => {
        isActuallyOnline = false;
        window.dispatchEvent(new CustomEvent('hff-connectivity-status', { detail: { online: false } }));
    });

    // Periodic checks
    setInterval(checkConnectivity, heartbeatIntervalMs);
    setInterval(syncSubmissions, syncIntervalMs);
}
