import React, { useEffect, useMemo, useState } from 'react';
import FileUpload from './FileUpload';
import StatsCard from './StatsCard';
import AttendanceChart from './AttendanceChart';
import { GenderChart, EducationChart, MaritalStatusChart } from './DemographicsCharts';
import FinancialImpact from './FinancialImpact';
import AIReport from './AIReport';
import { Users, UserCheck, CalendarDays, RefreshCw, AlertCircle, CloudDownload, CloudUpload, Wifi } from 'lucide-react';
import { cn } from '../lib/utils';
import { hffFetch } from '../lib/api';

const Dashboard = ({ mode = 'general' }) => {
    const [data, setData] = useState(null);
    const [sheetsMode, setSheetsMode] = useState(false);
    const [sheetsLoading, setSheetsLoading] = useState(false);
    const [sheetsError, setSheetsError] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);

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

    const loadFromGoogleSheets = async ({ silent = false, source = 'sqlite' } = {}) => {
        if (!silent) setSheetsLoading(true);
        if (!silent) setSheetsError(null);
        try {
            const url = source === 'cloud' ? '/api/stats?source=cloud' : '/api/stats';
            const resp = await hffFetch(url);

            const text = await resp.text();
            let json;
            try {
                json = JSON.parse(text);
            } catch (parseError) {
                console.error('[Dashboard] JSON Parse Error. Raw response:', text);
                throw new Error(`Failed to parse response as JSON. Check console for details. (Status: ${resp.status})`);
            }

            if (!resp.ok) {
                const errorMessage = json?.details || json?.error || `Server error (${resp.status})`;
                throw new Error(errorMessage);
            }

            setData(json);
            setSheetsMode(true);
            setLastUpdatedAt(new Date());
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            if (!silent) setSheetsError(msg);
            console.error('[Dashboard] Load Error:', msg);
        } finally {
            if (!silent) setSheetsLoading(false);
        }
    };


    // Auto-load if Phikwe mode
    useEffect(() => {
        if (mode === 'phikwe') {
            loadFromGoogleSheets();
        }
    }, [mode]);

    const canSyncUploadToSheets = useMemo(() => {
        return Boolean(!sheetsMode && data?.rawRows && Array.isArray(data.rawRows));
    }, [data, sheetsMode]);

    const syncUploadToGoogleSheets = async () => {
        setSheetsLoading(true);
        setSheetsError(null);
        try {
            // Step 1: Push local data to the server's SQLite store
            const resp = await hffFetch('/api/register', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rows: data.rawRows }),
            });
            if (!resp.ok) {
                const json = await resp.json();
                throw new Error(json?.details || json?.error || 'Failed to write to local system');
            }

            // Step 2: Push from server to Google Sheets
            const cloudResp = await hffFetch('/api/cloud/sync', { method: 'POST' });
            if (!cloudResp.ok) {
                const json = await cloudResp.json();
                throw new Error(json?.details || json?.error || 'Failed to sync to Google Sheets');
            }

            setSheetsMode(true);
            setLastUpdatedAt(new Date());
            alert("Sync to Google Sheets successful!");
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
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-700">
                {mode === 'phikwe' ? (
                    <div className="text-center max-w-lg">
                        <div className="h-16 w-16 bg-hff-primary/10 rounded-2xl flex items-center justify-center text-hff-primary mx-auto mb-6 animate-pulse">
                            <Wifi className="h-8 w-8" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">Connecting to Phikwe...</h2>
                        <p className="text-gray-500 mb-8">Fetching live registration data from local system storage.</p>
                        {sheetsLoading && <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-hff-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />}
                        {sheetsError && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                                {sheetsError}
                                <button onClick={() => loadFromGoogleSheets()} className="block mx-auto mt-2 font-bold underline">Try Again</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-10 max-w-lg">
                            <h2 className="text-3xl font-bold text-hff-primary mb-3">General Campaign Analysis</h2>
                            <p className="text-gray-500">Upload your HFF attendance register (XLSX/CSV) to generate accurate impact reports.</p>
                        </div>
                        <FileUpload onDataLoaded={handleDataLoaded} />
                    </>
                )}
            </div>
        );
    }

    // Debug logging to help diagnose data structure issues
    console.log('Dashboard data received:', data);
    console.log('Analytics:', data?.analytics);
    console.log('Campaign dates:', data?.campaignDates);

    // Validate data structure before rendering
    if (!data.analytics || !data.campaignDates) {
        console.error('Invalid data structure - missing analytics or campaignDates:', data);
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-700">
                <div className="text-center max-w-lg">
                    <div className="h-16 w-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-6">
                        <AlertCircle className="h-8 w-8" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Data Processing Error</h2>
                    <p className="text-gray-500 mb-4">The uploaded file was processed but the data structure is invalid.</p>
                    <p className="text-sm text-gray-600 mb-6">Please ensure your file matches the HFF attendance register template format.</p>
                    <button
                        onClick={handleReset}
                        className="px-6 py-3 bg-hff-primary text-white rounded-lg font-semibold hover:bg-hff-primary/90 transition-colors"
                    >
                        Try Another File
                    </button>
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
                                    Live: Local Storage
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

            {/* Daily Analysis Section */}
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Day-by-Day Analysis</h2>
                        <p className="text-gray-500">Analyze campaign impact for specific days across the 18-day cycle.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 max-w-md">
                        {campaignDates.slice(0, 18).map((date, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedDay(selectedDay === date ? null : date)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                                    selectedDay === date
                                        ? "bg-hff-primary text-white border-hff-primary shadow-md shadow-hff-primary/20"
                                        : "bg-gray-50 text-gray-600 border-gray-100 hover:border-hff-primary/30"
                                )}
                            >
                                Day {idx + 1}
                            </button>
                        ))}
                    </div>
                </div>

                {selectedDay ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Attendance on {selectedDay}</span>
                            <span className="text-4xl font-black text-hff-primary">
                                {data.participants.filter(p => p.attendance[selectedDay]).length}
                            </span>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Males</span>
                            <span className="text-3xl font-bold text-blue-600">
                                {data.participants.filter(p => p.attendance[selectedDay] && p.gender === 'M').length}
                            </span>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Females</span>
                            <span className="text-3xl font-bold text-pink-500">
                                {data.participants.filter(p => p.attendance[selectedDay] && p.gender === 'F').length}
                            </span>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-center justify-center">
                            <div className="text-center">
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Retention</span>
                                <span className="text-xl font-bold text-gray-700">
                                    {analytics.totalRegistered > 0
                                        ? Math.round((data.participants.filter(p => p.attendance[selectedDay]).length / analytics.totalRegistered) * 100)
                                        : 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                        <CalendarDays className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">Select a day from the list above to view specific analysis</p>
                    </div>
                )}
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
