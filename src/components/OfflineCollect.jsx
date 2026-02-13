import React, { useEffect, useRef, useState } from 'react';
import { Form } from '../enketo-core/js/form';
import { hffRegisterForm } from '../forms/hff_register_transformed';
import { saveSubmission, getPendingSubmissions } from '../lib/offlineStorage';
import { AlertCircle, CheckCircle2, Send, Database, ArrowLeft } from 'lucide-react';

// Import Enketo Styles
import '../enketo-core/sass/grid/grid.scss';

const OfflineCollect = ({ onBack }) => {
    const formContainerRef = useRef(null);
    const [formInstance, setFormInstance] = useState(null);
    const [pendingCount, setPendingCount] = useState(0);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (!formContainerRef.current) return;

        // Reset container
        formContainerRef.current.innerHTML = hffRegisterForm.html;
        const formEl = formContainerRef.current.querySelector('form');

        const data = {
            modelStr: hffRegisterForm.model,
            instanceStr: null,
            submitted: false,
            external: [],
            session: {},
        };

        const form = new Form(formEl, data, {});
        const loadErrors = form.init();

        if (loadErrors && loadErrors.length > 0) {
            console.error('Enketo Load Errors:', loadErrors);
        }

        setFormInstance(form);
        updatePendingCount();

        window.addEventListener('hff-sync-complete', updatePendingCount);

        return () => {
            window.removeEventListener('hff-sync-complete', updatePendingCount);
        };
    }, []);

    const updatePendingCount = async () => {
        const pending = await getPendingSubmissions();
        setPendingCount(pending.length);
    };

    const handleSubmit = async () => {
        if (!formInstance) return;

        const valid = await formInstance.validate();
        if (!valid) {
            setMessage({ type: 'error', text: 'Form contains errors. Please check the fields.' });
            return;
        }

        const record = formInstance.getDataStr();
        await saveSubmission(record);

        setMessage({ type: 'success', text: 'Record saved offline!' });
        formInstance.resetView();

        // Re-init form for next entry
        const formEl = formContainerRef.current.querySelector('form');
        const newForm = new Form(formEl, { modelStr: hffRegisterForm.model }, {});
        newForm.init();
        setFormInstance(newForm);

        updatePendingCount();

        setTimeout(() => setMessage(null), 3000);
    };

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            <div className="flex items-center justify-between">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-hff-primary transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                    Back to Home
                </button>
                <div className="flex items-center gap-2 bg-hff-primary/10 text-hff-primary px-3 py-1 rounded-full text-sm font-semibold">
                    <Database className="h-4 w-4" />
                    {pendingCount} Pending Sync
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-hff-primary p-6 text-white text-center">
                    <h2 className="text-2xl font-bold">Offline Data Collection</h2>
                    <p className="text-hff-primary-light opacity-90">Collect participant data without internet. Sync when back online.</p>
                </div>

                <div className="p-8">
                    {message && (
                        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                            <span className="font-medium">{message.text}</span>
                        </div>
                    )}

                    <div className="enketo-form-container" ref={formContainerRef}>
                        {/* Enketo form will be injected here */}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <button
                            onClick={handleSubmit}
                            className="w-full flex items-center justify-center gap-2 bg-hff-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-hff-primary/90 transition-all shadow-lg shadow-hff-primary/20 active:scale-[0.98]"
                        >
                            <Send className="h-5 w-5" />
                            Save Record Privately
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OfflineCollect;
