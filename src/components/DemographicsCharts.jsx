import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ['#006B5D', '#E3A817', '#2A9D8F', '#F4A261', '#E76F51', '#264653'];

export const GenderChart = ({ data }) => {
    // data: { 'M': 10, 'F': 20 }
    const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));

    // Custom label map if needed
    const labelMap = { 'M': 'Male', 'F': 'Female' };

    return (
        <Card className="shadow-sm border-gray-100">
            <CardHeader>
                <CardTitle className="text-gray-900 text-lg">Gender Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.name === 'F' ? '#E3A817' : '#006B5D'} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 text-sm text-gray-600 mt-2">
                    {chartData.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.name === 'F' ? '#E3A817' : '#006B5D' }}></div>
                            <span>{labelMap[entry.name] || entry.name} ({entry.value})</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export const EducationChart = ({ data }) => {
    // data: { 'P': 10, 'S': 20... }
    const chartData = [
        { name: 'Primary', code: 'P', value: data['P'] || 0 },
        { name: 'Junior', code: 'J', value: data['J'] || 0 },
        { name: 'Senior', code: 'S', value: data['S'] || 0 },
        { name: 'Tertiary', code: 'U', value: data['U'] || 0 },
    ];

    return (
        <Card className="shadow-sm border-gray-100">
            <CardHeader>
                <CardTitle className="text-gray-900 text-lg">Education Level</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="code" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip cursor={{ fill: '#F9FAFB' }} />
                        <Bar dataKey="value" fill="#006B5D" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export const MaritalStatusChart = ({ data }) => {
    // data: { 'S': 10, 'M': 5... }
    // Codes: S (Single), M (Married), W (Widow), D (Divorced), C (Cohabitating)
    const map = { 'S': 'Single', 'M': 'Married', 'W': 'Widow', 'D': 'Divorced', 'C': 'Cohabit' };
    const chartData = Object.entries(data).map(([key, value]) => ({
        name: map[key] || key,
        value
    })).sort((a, b) => b.value - a.value);

    return (
        <Card className="card col-span-full md:col-span-2 lg:col-span-1 shadow-sm border-gray-100">
            <CardHeader>
                <CardTitle className="text-gray-900 text-lg">Marital Status</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} tickLine={false} axisLine={false} fontSize={12} />
                        <Tooltip cursor={{ fill: '#F9FAFB' }} />
                        <Bar dataKey="value" fill="#E3A817" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};
