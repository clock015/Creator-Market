import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useGlobalContext } from '../context';

const SharesPieChart = () => {
  const {
    ownerShares,
    publicShares,
    otherShares
  } = useGlobalContext();
  const data = [
    { name: 'Owner', value: ownerShares },
    { name: 'Public', value: publicShares },
    { name: 'Other', value: otherShares }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  const renderLabel = (props) => {
    const { name, percent, x, y } = props;
    const percentage = `${(percent * 100).toFixed(1)}%`;

    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="12"
        fontWeight="bold"
        fill="black"
      >
        {`${name}: ${percentage}`}
      </text>
    );
  };

  return (
    <div className="flex justify-center items-center">
      <PieChart width={500} height={450}>
        <Pie
          data={data}
          cx={235}
          cy={250}
          labelLine={true}
          outerRadius={150}
          fill="#8884d8"
          dataKey="value"
          startAngle={90}
          endAngle={-270}
          label={renderLabel}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${(value * 100).toFixed(2)}%`, 'Share']} />
        <Legend />
      </PieChart>
    </div>
  );
};

export default SharesPieChart;