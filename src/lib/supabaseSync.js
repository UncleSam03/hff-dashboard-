import { supabase, isConfigured } from './supabase';
import db from './dexieDb';

/**
 * Supabase Sync Engine
 * 
 * Implements:
 * 1. UUID-based identification (prevents collisions).
 * 2. Last-Write-Wins logic using 'updated_at' timestamps.
 * 3. Atomic push of pending records from IndexedDB.
 */

let isSyncing = false;

/**
 * Push all pending records from IndexedDB to Supabase.
 */
export async function pushPendingToSupabase() {
    if (isSyncing || !isConfigured || !navigator.onLine) return;

    // Fetch all records from Dexie that are not 'synced'
    const pending = await db.participants
        .where('sync_status')
        .equals('pending')
        .toArray();

    if (pending.length === 0) return;

    isSyncing = true;
    console.log(`[SupabaseSync] Attempting to sync ${pending.length} records...`);

    try {
        for (const record of pending) {
            const { id, sync_status, ...recordToSync } = record;

            // Ensure updated_at exists for Last-Write-Wins
            if (!recordToSync.updated_at) {
                recordToSync.updated_at = new Date().toISOString();
            }

            // Upsert into Supabase registrations table
            // 'uuid' is the unique constraint for Last-Write-Wins
            const { error } = await supabase
                .from('registrations')
                .upsert(recordToSync, {
                    onConflict: 'uuid',
                    ignoreDuplicates: false // We WANT to overwrite with new data (Last-Write-Wins)
                });

            if (!error) {
                await db.participants.update(id, {
                    sync_status: 'synced',
                    synced_at: new Date().toISOString()
                });
                console.log(`[SupabaseSync] Successfully synced record: ${record.uuid}`);
            } else {
                console.error(`[SupabaseSync] Error syncing ${record.uuid}:`, error.message);
                await db.participants.update(id, { sync_status: 'failed' });
            }
        }
    } catch (err) {
        console.error("[SupabaseSync] Critical sync error:", err);
    } finally {
        isSyncing = false;
        // Trigger a custom event to notify UI components
        window.dispatchEvent(new CustomEvent('hff-supabase-sync-complete'));
    }
}

/**
 * Pull updates from Supabase to IndexedDB (One-way sync for dashboard consistency)
 * Uses updated_at to only get changes.
 */
export async function pullFromSupabase() {
    if (!isConfigured || !navigator.onLine) return;

    // Find the latest updated_at in our local store
    const latestLocal = await db.participants.orderBy('updated_at').last();
    const lastSyncTime = latestLocal?.updated_at || new Date(0).toISOString();

    const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .gt('updated_at', lastSyncTime);

    if (error) {
        console.error("[SupabaseSync] Error pulling updates:", error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log(`[SupabaseSync] Pulling ${data.length} new records from Supabase...`);
        for (const remoteRecord of data) {
            // Put will update if UUID exists (Dexie doesn't auto-handle UUID as key yet, 
            // so we find existing or add new)
            const existing = await db.participants.where('uuid').equals(remoteRecord.uuid).first();

            if (existing) {
                // Last-Write-Wins: only update if remote is newer
                if (new Date(remoteRecord.updated_at) > new Date(existing.updated_at)) {
                    await db.participants.update(existing.id, {
                        ...remoteRecord,
                        sync_status: 'synced'
                    });
                }
            } else {
                await db.participants.add({
                    ...remoteRecord,
                    sync_status: 'synced'
                });
            }
        }
        window.dispatchEvent(new CustomEvent('hff-supabase-data-updated'));
    }
}

/**
 * Initialize sync listeners
 */
export function initSupabaseSync() {
    // Sync on online/offline events
    window.addEventListener('online', () => {
        console.log("[SupabaseSync] Back online. Triggering sync...");
        pushPendingToSupabase();
    });

    // Frequent sync interval (optional, can be adjusted)
    setInterval(pushPendingToSupabase, 30000); // Push every 30s
    setInterval(pullFromSupabase, 60000);    // Pull every 60s

    // Initial sync
    pushPendingToSupabase();
    pullFromSupabase();
}
