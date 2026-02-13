import React from 'react';
import { LayoutDashboard, Heart, LogOut } from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthContext";

const Layout = ({ children, onBackToHome, isHome }) => {
    const { user } = useAuth();

    async function onSignOut() {
        await supabase.auth.signOut();
    }

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={onBackToHome}
                    >
                        <div className="h-10 w-10 bg-hff-primary rounded-xl flex items-center justify-center shadow-lg shadow-hff-primary/20 group-hover:scale-105 transition-transform">
                            <Heart className="text-white h-6 w-6 fill-current" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 leading-tight">HFF Campaign Dashboard</h1>
                            <p className="text-xs text-gray-500 font-medium tracking-wide">IMPACT TRACKER</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {!isHome && (
                            <button
                                onClick={onBackToHome}
                                className="hidden sm:flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-hff-primary transition-colors pr-4 border-r border-gray-100"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Home
                            </button>
                        )}
                        <div className="text-right hidden sm:block">
                            <p className="text-xs text-gray-400 font-medium">System Status</p>
                            <p className="text-sm font-semibold text-hff-primary">Ready</p>
                        </div>
                        {user ? (
                            <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
                                <div className="text-right hidden md:block">
                                    <p className="text-xs text-gray-400 font-medium whitespace-nowrap">Signed in as</p>
                                    <p className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">{user.email}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={onSignOut}
                                    className="p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                                    title="Sign out"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        ) : null}
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
