import React from 'react';
import { useGlobalContext } from '../context';

const SalaryUpdateTable = () => {
    const {
        salaryArray
    } = useGlobalContext();
    const testDataArray = [
        {
            "creator": "0x74258C0B0B5Ed282Bc7feB11d43650c66652F4Ea",
            "updateTime": 1732716132,
            "currentAmount": 0,
            "pendingAmount": 5,
            "finishTime": 1732886496
        },
        {
            "creator": "0x1234567890AbCdEfG123456789AbCdEf",
            "updateTime": 1732716200,
            "currentAmount": 2,
            "pendingAmount": 3,
            "finishTime": 0
        },
        {
            "creator": "0x9876543210XyZaBc987654321XyZaBc",
            "updateTime": 1732716300,
            "currentAmount": 1,
            "pendingAmount": 4,
            "finishTime": 1732800000
        },
        {
            "creator": "0xAbCdEfG123456789AbCdEfG12345678",
            "updateTime": 1732716400,
            "currentAmount": 3,
            "pendingAmount": 2,
            "finishTime": 0
        }
    ];

    const formatDate = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    return (
        <div className="p-6 space-y-4 mx-auto bg-white shadow-lg rounded-lg w-full">
            <div className="grid grid-cols-5 gap-2 font-bold bg-gray-100 p-2">
                <div>Creator</div>
                <div>Update Time</div>
                <div>Current Amount</div>
                <div>Pending Amount</div>
                <div>Finish Time</div>
            </div>
            {salaryArray.map((data, index) => (
                <div key={index} className="grid grid-cols-5 gap-2 border-b p-2">
                    <div className="text-blue-600 truncate">{data.creator}</div>
                    <div>{formatDate(data.updateTime)}</div>
                    <div>{data.currentAmount}</div>
                    <div>{data.pendingAmount}</div>
                    <div className={`font-bold ${data.finishTime > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.finishTime > 0 ? formatDate(data.finishTime) : 'not completed'}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SalaryUpdateTable;