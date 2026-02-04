import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from "@/lib/utils";

const FileUpload = ({ onDataLoaded }) => {
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const onDrop = useCallback((acceptedFiles) => {
        setError(null);
        const file = acceptedFiles[0];
        if (!file) return;

        setProcessing(true);
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                processData(jsonData);
            } catch (err) {
                console.error(err);
                setError("Failed to parse file. Please ensure it matches the HFF template.");
                setProcessing(false);
            }
        };

        reader.readAsArrayBuffer(file);
    }, [onDataLoaded]);

    const processData = (rows) => {
        // 1. Locate the header row (Starts with "No." or check known index 8)
        // We found in analysis that Row 8 (index 8) is the header.
        // Row 9 (index 9) contains the dates.
        // Row 10 (index 10) starts the data.

        const headerRowIndex = 8;
        const dateRowIndex = 9;
        const dataStartIndex = 10;

        if (rows.length < dataStartIndex) {
            throw new Error("File too short");
        }

        // Verify header
        const headers = rows[headerRowIndex];
        if (!headers || headers[0] !== "No.") {
            // Fallback or error? Let's try to find "No." if row 8 isn't it
            // But for now, strict adherence to observed structure
            // console.warn("Header row might be different", headers);
        }

        // Extract Dates
        const dateRow = rows[dateRowIndex];
        // Columns 10-21 are the expected dates based on analysis
        const attendanceCols = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
        const campaignDates = attendanceCols.map(idx => dateRow[idx] || `Day ${idx}`);

        const parsedData = [];
        const participants = [];

        const skippedRows = [];

        for (let i = dataStartIndex; i < rows.length; i++) {
            const row = rows[i];

            // STRICT VALIDATION
            // 1. Must have a row
            // 2. Must have a First Name (Index 1) that is a non-empty string
            // 3. Must have an ID (Index 0) to avoid reading footer/total rows
            const firstName = row[1];
            if (!row || !firstName || typeof firstName !== 'string' || firstName.trim() === '' || row[0] == null) {
                // Log missing basic info if row is not empty
                if (row && (row[0] || row[1])) {
                    skippedRows.push({
                        row: i + 1,
                        reason: "Missing ID or First Name"
                    });
                }
                continue;
            }

            // Gender Normalization & Validation
            let rawGender = row[3];
            let gender = 'Unknown';
            if (rawGender && typeof rawGender === 'string') {
                const g = rawGender.trim().toUpperCase();
                if (g === 'M' || g === 'MALE') gender = 'M';
                else if (g === 'F' || g === 'FEMALE') gender = 'F';
            }

            // Check if Gender is missing
            if (!rawGender || gender === 'Unknown') {
                skippedRows.push({
                    row: i + 1,
                    name: firstName,
                    reason: "Missing or Invalid Gender"
                });
                continue; // SKIP ENTIRELY per user request
            }

            const participant = {
                id: row[0],
                firstName: firstName.trim(),
                lastName: row[2],
                gender: gender,
                age: row[4],
                education: row[6], // 'P', 'J', 'S', 'U'
                maritalStatus: row[7], // 'S', 'M', 'W', 'D', 'C'
                occupation: row[9],
                attendance: {} // Map date -> status (1/0)
            };

            let daysAttended = 0;
            attendanceCols.forEach((colIdx, index) => {
                const dateKey = campaignDates[index];
                const val = row[colIdx];
                // '1' indicates present. Sometimes it might be numeric 1 or string "1".
                const isPresent = val == 1;
                participant.attendance[dateKey] = isPresent;
                if (isPresent) daysAttended++;
            });

            participant.daysAttended = daysAttended;
            participants.push(participant);
        }

        const analytics = calculateAnalytics(participants, campaignDates);

        onDataLoaded({ participants, analytics, campaignDates, skippedRows });
        setProcessing(false);
    };

    const calculateAnalytics = (participants, dates) => {
        const totalRegistered = participants.length;

        // Unique Attendees: attended at least 1 day
        const uniqueAttendees = participants.filter(p => p.daysAttended > 0).length;

        // Average Attendance per day
        const dailyStats = dates.map(date => {
            const count = participants.filter(p => p.attendance[date]).length;
            return { date, count };
        });

        const totalAttendanceCount = dailyStats.reduce((acc, curr) => acc + curr.count, 0);
        const avgAttendance = dates.length > 0 ? (totalAttendanceCount / dates.length).toFixed(1) : 0;

        // Gender Distribution
        const genderDist = participants.reduce((acc, p) => {
            const g = p.gender ? p.gender.trim().toUpperCase() : 'Unknown';
            acc[g] = (acc[g] || 0) + 1;
            return acc;
        }, {});

        // Education
        const eduDist = participants.reduce((acc, p) => {
            const e = p.education ? p.education.trim().toUpperCase() : 'Unknown';
            acc[e] = (acc[e] || 0) + 1;
            return acc;
        }, {});

        // Marital Status
        const maritalDist = participants.reduce((acc, p) => {
            const m = p.maritalStatus ? p.maritalStatus.trim().toUpperCase() : 'Unknown';
            acc[m] = (acc[m] || 0) + 1;
            return acc;
        }, {});

        return {
            totalRegistered,
            uniqueAttendees,
            avgAttendance,
            dailyStats,
            demographics: {
                gender: genderDist,
                education: eduDist,
                maritalStatus: maritalDist
            }
        };
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv']
        },
        multiple: false
    });

    return (
        <div className="w-full max-w-2xl mx-auto mb-8">
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-xl p-8 transition-colors duration-200 cursor-pointer flex flex-col items-center justify-center text-center",
                    isDragActive ? "border-hff-primary bg-hff-primary/5" : "border-gray-200 hover:border-hff-primary/50 bg-white",
                    error && "border-red-500 bg-red-50"
                )}
            >
                <input {...getInputProps()} />

                {processing ? (
                    <div className="flex flex-col items-center animate-pulse">
                        <Loader2 className="h-10 w-10 text-hff-primary animate-spin mb-4" />
                        <p className="text-gray-600 font-medium">Processing attendance data...</p>
                    </div>
                ) : (
                    <>
                        <div className="h-14 w-14 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-hff-primary">
                            <FileSpreadsheet className="h-7 w-7" />
                        </div>
                        {isDragActive ? (
                            <p className="text-hff-primary font-bold text-lg">Drop the file here...</p>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-gray-900 font-semibold text-lg">
                                    Drag & drop headers file or <span className="text-hff-primary underline">browse</span>
                                </p>
                                <p className="text-sm text-gray-500">
                                    Supports .xlsx, .xls, .csv (HFF Format)
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 mt-4 text-red-600 bg-red-50 p-3 rounded-lg text-sm font-medium">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}
        </div>
    );
};

export default FileUpload;
