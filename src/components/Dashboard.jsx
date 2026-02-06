import React, { useEffect, useMemo, useState } from 'react';
import FileUpload from './FileUpload';
import StatsCard from './StatsCard';
import AttendanceChart from './AttendanceChart';
import { GenderChart, EducationChart, MaritalStatusChart } from './DemographicsCharts';
import FinancialImpact from './FinancialImpact';
import AIReport from './AIReport';
import { Users, UserCheck, CalendarDays, RefreshCw, AlertCircle, CloudDownload, CloudUpload, Wifi } from 'lucide-react';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [sheetsMode, setSheetsMode] = useState(false);
    const [sheetsLoading, setSheetsLoading] = useState(false);
    const [sheetsError, setSheetsError] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

    const handleDataLoaded = (parsedData) => {
        setData(parsedData);
        setSheetsMode(false);
        setSheetsError(null);
    };

    const handleReset = () => {
        setData(null);
        setSheetsMode(false);
        setSheetsError(null);
    };

    const loadFromGoogleSheets = async ({ silent = false } = {}) => {
        if (!silent) setSheetsLoading(true);
        if (!silent) setSheetsError(null);
        try {
            const resp = await fetch('/api/stats', { method: 'GET' });
            const json = await resp.json();
            if (!resp.ok) throw new Error(json?.details || json?.error || 'Failed to load from Google Sheets');

            setData(json);
            setSheetsMode(true);
            setLastUpdatedAt(new Date());
        } catch (e) {
            if (!silent) setSheetsError(e instanceof Error ? e.message : String(e));
        } finally {
            if (!silent) setSheetsLoading(false);
        }
    };

    const canSyncUploadToSheets = useMemo(() => {
        return Boolean(!sheetsMode && data?.rawRows && Array.isArray(data.rawRows));
    }, [data, sheetsMode]);

    const syncUploadToGoogleSheets = async () => {
        setSheetsLoading(true);
        setSheetsError(null);
        try {
            const resp = await fetch('/api/register', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rows: data.rawRows }),
            });
            const json = await resp.json();
            if (!resp.ok) throw new Error(json?.details || json?.error || 'Failed to write to Google Sheets');

            setData(json);
            setSheetsMode(true);
            setLastUpdatedAt(new Date());
        } catch (e) {
            setSheetsError(e instanceof Error ? e.message : String(e));
        } finally {
            setSheetsLoading(false);
        }
    };

    useEffect(() => {
        if (!sheetsMode || !autoRefresh) return;
        const id = setInterval(() => {
            loadFromGoogleSheets({ silent: true });
        }, 15000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sheetsMode, autoRefresh]);

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-center mb-10 max-w-lg">
                    <h2 className="text-3xl font-bold text-hff-primary mb-3">Campaign Analytics</h2>
                    <p className="text-gray-500">Upload your HFF attendance register (XLSX/CSV) to generate accurate impact reports.</p>
                </div>
                <FileUpload onDataLoaded={handleDataLoaded} />

                <div className="w-full max-w-2xl mx-auto">
                    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 bg-hff-primary/10 rounded-lg flex items-center justify-center text-hff-primary">
                                <Wifi className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Real-time stats (Google Sheets)</p>
                                <p className="text-sm text-gray-500">Load the latest register from your connected Google Sheet.</p>
                                {sheetsError && (
                                    <p className="text-sm text-red-600 mt-2">{sheetsError}</p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => loadFromGoogleSheets()}
                            disabled={sheetsLoading}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-hff-primary text-white font-semibold text-sm hover:bg-hff-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <CloudDownload className="h-4 w-4" />
                            {sheetsLoading ? "Loading..." : "Load Live"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const { analytics, campaignDates } = data;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Header Actions */}
            <div className="flex justify-between items-start">
                <div>
                    {data.skippedRows && data.skippedRows.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-2xl">
                            <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
                                <AlertCircle className="h-5 w-5" />
                                <span>{data.skippedRows.length} rows were skipped due to missing data</span>
                            </div>
                            <div className="max-h-32 overflow-y-auto text-sm text-amber-700 space-y-1 pr-2">
                                {data.skippedRows.map((err, idx) => (
                                    <div key={idx} className="flex justify-between border-b border-amber-100 last:border-0 pb-1">
                                        <span>Row {err.row}: {err.name || 'Unknown Name'}</span>
                                        <span className="font-semibold">{err.reason}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {sheetsError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-2xl mt-4">
                            <div className="flex items-center gap-2 text-red-700 font-medium">
                                <AlertCircle className="h-5 w-5" />
                                <span>{sheetsError}</span>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-3 flex-wrap justify-end">
                        {canSyncUploadToSheets && (
                            <button
                                onClick={syncUploadToGoogleSheets}
                                disabled={sheetsLoading}
                                className="flex items-center gap-2 text-sm font-semibold bg-white border border-gray-200 px-3 py-2 rounded-lg hover:border-hff-primary/50 hover:text-hff-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                title="Write this uploaded register into Google Sheets"
                            >
                                <CloudUpload className="h-4 w-4" />
                                {sheetsLoading ? "Syncing..." : "Sync to Google Sheet"}
                            </button>
                        )}

                        {sheetsMode && (
                            <button
                                onClick={() => loadFromGoogleSheets()}
                                disabled={sheetsLoading}
                                className="flex items-center gap-2 text-sm font-semibold bg-white border border-gray-200 px-3 py-2 rounded-lg hover:border-hff-primary/50 hover:text-hff-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                title="Refresh stats from Google Sheets"
                            >
                                <RefreshCw className="h-4 w-4" />
                                {sheetsLoading ? "Refreshing..." : "Refresh Live"}
                            </button>
                        )}

                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-hff-primary transition-colors"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Upload New File
                        </button>
                    </div>

                    {sheetsMode && (
                        <div className="text-right text-xs text-gray-500">
                            <div className="flex items-center justify-end gap-2">
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-hff-primary/10 text-hff-primary font-semibold">
                                    <Wifi className="h-3.5 w-3.5" />
                                    Live: Google Sheet
                                </span>
                                <label className="inline-flex items-center gap-2 select-none cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="accent-hff-primary"
                                        checked={autoRefresh}
                                        onChange={(e) => setAutoRefresh(e.target.checked)}
                                    />
                                    Auto-refresh (15s)
                                </label>
                            </div>
                            {lastUpdatedAt && <div className="mt-1">Last updated: {lastUpdatedAt.toLocaleTimeString()}</div>}
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    title="Total Registered"
                    value={analytics.totalRegistered}
                    icon={Users}
                    description="Participants in database"
                />
                <StatsCard
                    title="Active Participants"
                    value={analytics.uniqueAttendees}
                    icon={UserCheck}
                    description="Attended at least 1 day"
                    className="border-l-4 border-l-hff-primary"
                />
                <StatsCard
                    title="Avg Daily Attendance"
                    value={analytics.avgAttendance}
                    icon={CalendarDays}
                    description="Participants per session"
                />
            </div>

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <AttendanceChart data={analytics.dailyStats} />

                <div className="lg:col-span-1 space-y-6">
                    <GenderChart data={analytics.demographics.gender} />
                </div>
            </div>

            {/* Demographics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EducationChart data={analytics.demographics.education} />
                <MaritalStatusChart data={analytics.demographics.maritalStatus} />
            </div>

            {/* Bottom Section */}
            <FinancialImpact uniqueAttendees={analytics.uniqueAttendees} />

            <AIReport analytics={analytics} />

        </div>
    );
};

export default Dashboard;
