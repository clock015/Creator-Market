import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { useGlobalContext } from '../context';

const TimeScaledCharts = () => {
    const {
        rawData
      } = useGlobalContext();
    // 示例数据 - 使用以太坊时间戳（秒级）
    // const rawData = [
    //     { timestamp: 1709251200, assets: 1000, shares: 500 }, // 基准时间
    //     { timestamp: 1709251800, assets: 1200, shares: 550 }, // +10分钟
    //     { timestamp: 1709252400, assets: 1100, shares: 600 }, // +20分钟
    //     { timestamp: 1709253600, assets: 1400, shares: 580 }, // +40分钟
    //     { timestamp: 1709255400, assets: 1600, shares: 620 }, // +70分钟
    // ];

    // 计算时间刻度
    const minTimestamp = Math.min(...rawData.map(d => d.timestamp));
    const processedData = rawData.map(item => ({
        ...item,
        timeInMinutes: Math.round((item.timestamp - minTimestamp) / 60),
        displayTime: new Date(item.timestamp * 1000).toLocaleString(),
        ratio: +(item.assets / item.shares).toFixed(4)
    }));

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const dataPoint = processedData.find(d => d.timeInMinutes === label);
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md">
                    <p className="text-sm font-medium text-gray-900">Time: {dataPoint.displayTime}</p>
                    <p className="text-xs text-gray-600">({label} minutes from start)</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm mt-1">
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const formatXAxis = (timeInMinutes) => `${timeInMinutes}m`;

    return (
        <div className="space-y-8 w-full">
            {/* Assets and Shares Chart */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Assets and Shares Over Time
                    </h2>
                </div>
                <div className="p-6">
                    <div className="w-full h-80"> {/* 增加高度 */}
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={processedData}
                                margin={{
                                    top: 10,
                                    right: 30,
                                    left: 20,
                                    bottom: 65  // 增加底部边距，为X轴标签留出空间
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="timeInMinutes"
                                    type="number"
                                    domain={['dataMin', 'dataMax']}
                                    tickFormatter={formatXAxis}
                                    label={{
                                        value: 'Minutes from Start',
                                        position: 'bottom',
                                        offset: 40  // 调整标签位置
                                    }}
                                    tick={{
                                        angle: -45,  // 倾斜标签
                                        textAnchor: 'end',
                                        dy: 20
                                    }}
                                />
                                <YAxis
                                    yAxisId="left"
                                    label={{
                                        value: 'Assets',
                                        angle: -90,
                                        position: 'insideLeft',
                                        offset: -10  // 调整标签位置
                                    }}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    label={{
                                        value: 'Shares',
                                        angle: 90,
                                        position: 'insideRight',
                                        offset: -10  // 调整标签位置
                                    }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    wrapperStyle={{
                                        paddingTop: '20px',
                                        marginBottom: '-55px'  // 调整图例位置
                                    }}
                                />
                                <Line
                                    yAxisId="left"
                                    type="linear"
                                    dataKey="assets"
                                    stroke="#8884d8"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 8 }}
                                    name="Assets"
                                />
                                <Line
                                    yAxisId="right"
                                    type="linear"
                                    dataKey="shares"
                                    stroke="#82ca9d"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 8 }}
                                    name="Shares"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Ratio Chart */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Assets/Shares Ratio Over Time
                    </h2>
                </div>
                <div className="p-6">
                    <div className="w-full h-80"> {/* 增加高度 */}
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={processedData}
                                margin={{
                                    top: 10,
                                    right: 30,
                                    left: 20,
                                    bottom: 65  // 增加底部边距，为X轴标签留出空间
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="timeInMinutes"
                                    type="number"
                                    domain={['dataMin', 'dataMax']}
                                    tickFormatter={formatXAxis}
                                    label={{
                                        value: 'Minutes from Start',
                                        position: 'bottom',
                                        offset: 40  // 调整标签位置
                                    }}
                                    tick={{
                                        angle: -45,  // 倾斜标签
                                        textAnchor: 'end',
                                        dy: 20
                                    }}
                                />
                                <YAxis
                                    label={{
                                        value: 'Assets/Shares Ratio',
                                        angle: -90,
                                        position: 'insideLeft',
                                        offset: -10  // 调整标签位置
                                    }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    wrapperStyle={{
                                        paddingTop: '20px',
                                        marginBottom: '-55px'  // 调整图例位置
                                    }}
                                />
                                <Line
                                    type="linear"
                                    dataKey="ratio"
                                    stroke="#ff7300"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 8 }}
                                    name="Ratio"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeScaledCharts;