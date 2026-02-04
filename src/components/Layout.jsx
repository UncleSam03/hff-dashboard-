import React from 'react';
import { LayoutDashboard } from 'lucide-react';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-hff-bg font-sans text-gray-900">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-hff-primary rounded-lg flex items-center justify-center shadow-lg shadow-hff-primary/20">
                            <LayoutDashboard className="text-white h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 leading-tight">HFF Campaign Dashboard</h1>
                            <p className="text-xs text-gray-500 font-medium tracking-wide">IMPACT TRACKER</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs text-gray-400 font-medium">Current Campaign</p>
                            <p className="text-sm font-semibold text-hff-primary">May 2025</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
};

export default Layout;
