import React, { useState } from 'react';
import FileUpload from './FileUpload';
import StatsCard from './StatsCard';
import AttendanceChart from './AttendanceChart';
import { GenderChart, EducationChart, MaritalStatusChart } from './DemographicsCharts';
import FinancialImpact from './FinancialImpact';
import AIReport from './AIReport';
import { Users, UserCheck, CalendarDays, RefreshCw, AlertCircle } from 'lucide-react';

const Dashboard = () => {
    const [data, setData] = useState(null);

    const handleDataLoaded = (parsedData) => {
        setData(parsedData);
    };

    const handleReset = () => {
        setData(null);
    };

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-center mb-10 max-w-lg">
                    <h2 className="text-3xl font-bold text-hff-primary mb-3">Campaign Analytics</h2>
                    <p className="text-gray-500">Upload your HFF attendance register (XLSX/CSV) to generate accurate impact reports.</p>
                </div>
                <FileUpload onDataLoaded={handleDataLoaded} />
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
                </div>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-hff-primary transition-colors"
                >
                    <RefreshCw className="h-4 w-4" />
                    Upload New File
                </button>
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
