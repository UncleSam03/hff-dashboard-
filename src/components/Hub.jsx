import React, { useState } from 'react';
import { Users, CalendarCheck, ClipboardList, ArrowLeft } from 'lucide-react';
import PersonList from './hub/PersonList';
import AttendanceSheet from './hub/AttendanceSheet';
import NoticeBoard from './hub/NoticeBoard';
import './hub/Hub.css';

const Hub = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState('people'); // 'people', 'attendance', 'notice'

    const renderContent = () => {
        switch (activeTab) {
            case 'people':
                return <PersonList />;
            case 'attendance':
                return <AttendanceSheet />;
            case 'notice':
                return <NoticeBoard />;
            default:
                return <PersonList />;
        }
    };

    return (
        <div className="hub-container min-h-screen bg-gray-50/30">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-500 hover:text-hff-primary mb-2 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Campaign Hub</h1>
                    <p className="text-gray-500">Manage participants, attendance, and team status.</p>
                </div>

                {/* Navigation Tabs */}
                <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('people')}
                        className={`hub-nav-button flex items-center gap-2 ${activeTab === 'people' ? 'active' : ''}`}
                    >
                        <Users className="h-5 w-5" />
                        <span>People</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`hub-nav-button flex items-center gap-2 ${activeTab === 'attendance' ? 'active' : ''}`}
                    >
                        <CalendarCheck className="h-5 w-5" />
                        <span>Attendance</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('notice')}
                        className={`hub-nav-button flex items-center gap-2 ${activeTab === 'notice' ? 'active' : ''}`}
                    >
                        <ClipboardList className="h-5 w-5" />
                        <span>Notice Board</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-transparent">
                {renderContent()}
            </div>
        </div>
    );
};

export default Hub;
