import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useGlobalContext } from '../context';

const formatYAxis = (value) => {
  if (value >= 1e18) return `${(value / 1e18).toFixed(1)}E`;
  if (value >= 1e15) return `${(value / 1e15).toFixed(1)}P`;
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}G`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(1);
};

const CompanyDashboard = () => {
  const [chartData, setChartData] = useState([]);

  const {
    futureSpsData
  } = useGlobalContext();

  const calculateChartData = () => {
    let testData = [...futureSpsData];

    if (testData.length) {
      const lastItem = testData[testData.length - 1];
      let pendingTime = 86400 * 30;
      const newItem = {
        time: lastItem.time + pendingTime,
        totalSps: lastItem.totalSps,
      };
      testData.push(newItem);
    }
    console.log(testData)

    let previousValue = 0; // 初始化前一个累计值为 0
    const cumulativeData = []; // 存储最终的累计数据

    // 遍历 testData 数组，使用 for 循环逐项计算累计值
    for (let index = 0; index < testData.length; index++) {
      const curr = testData[index];

      // 如果是第一项，初始化值为 0
      const timeDifference = index === 0 ? 0 : curr.time - testData[index - 1].time;

      // 获取上一项的 totalSps
      const prevTotalSps = index === 0 ? 0 : testData[index - 1].totalSps;

      // 计算当前项的累计值
      const currentValue = previousValue + timeDifference * prevTotalSps;

      // 更新 previousValue 为当前项的累计值
      previousValue = currentValue;

      // 将当前的时间和累计值存入结果数组
      cumulativeData.push({ time: curr.time, value: currentValue });
    }

    // 将最终数据设置为 chartData
    setChartData(cumulativeData);
    console.log(cumulativeData)
  };

  useEffect(() => {
    calculateChartData();
  }, [futureSpsData]);

  return (
    <div className="w-full p-8 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-800">Future Expense</h2>
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="time"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(unixTime) => new Date(unixTime * 1000).toLocaleString()}
            />
            <YAxis
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatYAxis}
            />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip
              labelFormatter={(label) => new Date(label * 1000).toLocaleString()}
              formatter={(value) => formatYAxis(value)}
            />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CompanyDashboard;