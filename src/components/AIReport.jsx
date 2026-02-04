import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from 'lucide-react';

const AIReport = ({ analytics }) => {
    if (!analytics) return null;

    const generateReport = () => {
        const { totalRegistered, uniqueAttendees, avgAttendance, dailyStats, demographics } = analytics;

        // Find peak day
        const peakDay = dailyStats.reduce((prev, current) => (prev.count > current.count) ? prev : current, dailyStats[0] || {});

        // Top demographics
        const females = demographics.gender['F'] || 0;
        const femalePct = ((females / totalRegistered) * 100).toFixed(1);

        return `
CAMPAIGN IMPACT SUMMARY REPORT

During the May 2025 campaign, The Healthy Families Foundation successfully registered ${totalRegistered} participants. 
Of these, ${uniqueAttendees} individuals attended at least one session, demonstrating strong community engagement.

Participation Trends:
The campaign saw an average daily attendance of ${avgAttendance} participants. The most active day was ${peakDay.date} with ${peakDay.count} attendees.

Demographic Highlights:
Women were significant drivers of participation, accounting for ${femalePct}% of all attendees. 
Educationally, the cohort showed diverse backgrounds, with key representation from ${Object.keys(demographics.education).join(', ')} levels.

Impact Statement:
This data reflects sustained community interest and validates the need for continued HFF presence in the region.
    `.trim();
    };

    return (
        <Card className="col-span-full shadow-sm border-gray-100 mb-8">
            <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-hff-secondary fill-hff-secondary/20" />
                    AI Generated Insights
                </CardTitle>
            </CardHeader>
            <CardContent>
                <textarea
                    className="w-full h-48 p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-mono text-sm leading-relaxed focus:ring-2 focus:ring-hff-primary focus:border-transparent outline-none resize-none"
                    readOnly
                    value={generateReport()}
                />
            </CardContent>
        </Card>
    );
};

export default AIReport;
