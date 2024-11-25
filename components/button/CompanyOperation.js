import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useGlobalContext } from '../../context';

const OwnerManagementPanel = ({
}) => {
    const {
        isOwner,
        ownerShares,
        paymentSplitContract,
        publicV4626Contract,
        publicV4626Address,
        assetsDecimals,
    } = useGlobalContext();
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
    const [isCapitalDialogOpen, setIsCapitalDialogOpen] = useState(false);
    const [isListPublicDialogOpen, setIsListPublicDialogOpen] = useState(false);
    const [isSalarySubmitDialogOpen, setIsSalarySubmitDialogOpen] = useState(false);
    const [isCompleteSalaryDialogOpen, setIsCompleteSalaryDialogOpen] = useState(false);

    const [shareAmount, setShareAmount] = useState(0);
    const [capitalAmount, setCapitalAmount] = useState('');
    const [salaryCreator, setSalaryCreator] = useState('');
    const [salaryAmount, setSalaryAmount] = useState('');
    const [maxSalary, setMaxSalary] = useState(0);


    const formatPercentage = (value) => {
        return (value * 100).toFixed(4) + '%';
    };

    const handleShareSliderChange = (e) => {
        const value = parseFloat(e.target.value);
        setShareAmount(value);
    };

    const handleShareInputChange = (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value) && value >= 0 && value <= ownerShares) {
            setShareAmount(value);
        }
    };

    const handleShareConfirm = async () => {
        try {
            let shareWithDecimals = ethers.utils.parseUnits(shareAmount.toString(), 18);
            // console.log(shareAmount)
            await paymentSplitContract.transfer(publicV4626Address, shareWithDecimals);
        } catch (error) {
            console.error('Error executing transaction:', error);
        }
        setIsShareDialogOpen(false);
        setShareAmount(0);
    };

    return (
        <div className="p-6 space-y-4 max-w-md mx-auto bg-white shadow-lg rounded-lg">
            <div className={`p-4 ${isOwner ? 'bg-green-50' : 'bg-red-50'} rounded-lg mb-4`}>
                <p className={`${isOwner ? 'text-green-700' : 'text-red-700'}`}>
                    {isOwner
                        ? "You are the company owner, you can operate the company."
                        : "You are not the company owner, you cannot operate the company."}
                </p>
            </div>

            {isOwner && (
                <div className="space-y-4">
                    <button
                        onClick={() => setIsShareDialogOpen(true)}
                        className="w-full bg-blue-100 text-blue-600 hover:bg-blue-200 p-3 rounded-lg font-medium"
                    >
                        Increase Public Shares
                    </button>

                    <button
                        onClick={() => setIsCapitalDialogOpen(true)}
                        className="w-full bg-green-100 text-green-600 hover:bg-green-200 p-3 rounded-lg font-medium"
                    >
                        Increase Registered Capital
                    </button>

                    <button
                        onClick={() => setIsListPublicDialogOpen(true)}
                        className="w-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 p-3 rounded-lg font-medium"
                    >
                        List Publicly
                    </button>

                    <button
                        onClick={async () => {
                            setIsSalarySubmitDialogOpen(true)
                            try {
                                const currentTotalSps = await publicV4626Contract.totalSps();
                                const currentPendingSps = await publicV4626Contract.pendingSps();
                                const currentMinPendingSps = await publicV4626Contract.minPendingSps();
                                const normalizedTotalSps = parseFloat(ethers.utils.formatUnits(currentTotalSps.toString(), assetsDecimals));
                                const normalizedPendingSps = parseFloat(ethers.utils.formatUnits(currentPendingSps.toString(), assetsDecimals));
                                const normalizedMinPendingSps = parseFloat(ethers.utils.formatUnits(currentMinPendingSps.toString(), assetsDecimals));
                                let amount;
                                if (normalizedTotalSps >= normalizedPendingSps * 10) {
                                    amount = normalizedMinPendingSps * 86400 * 30 + normalizedTotalSps * 8640 * 30 - normalizedPendingSps * 86400 * 30;
                                } else {
                                    amount = normalizedMinPendingSps * 86400 * 30;
                                }
                                setMaxSalary(amount);
                            } catch (error) {
                                console.error('Error executing transaction:', error);
                            }
                        }}
                        className="w-full bg-purple-100 text-purple-600 hover:bg-purple-200 p-3 rounded-lg font-medium"
                    >
                        Submit Salary Modification Request
                    </button>

                    <button
                        onClick={() => setIsCompleteSalaryDialogOpen(true)}
                        className="w-full bg-red-100 text-red-600 hover:bg-red-200 p-3 rounded-lg font-medium"
                    >
                        Complete Salary Modification Request
                    </button>
                </div>
            )}

            {/* Increase Public Shares Dialog */}
            {isShareDialogOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full m-4">
                        <h2 className="text-xl font-bold mb-4">Increase Public Shares</h2>

                        <div className="space-y-4">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>0.0000%</span>
                                <span>Max: {formatPercentage(ownerShares)}</span>
                            </div>

                            <input
                                type="range"
                                value={shareAmount}
                                onChange={handleShareSliderChange}
                                min={0}
                                max={ownerShares}
                                step={0.000001}
                                className="w-full"
                            />

                            <div className="relative">
                                <input
                                    type="number"
                                    value={shareAmount}
                                    onChange={handleShareInputChange}
                                    max={ownerShares}
                                    min={0}
                                    step={0.000001}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder={`Enter amount (max: ${formatPercentage(ownerShares)})`}
                                />
                                <div className="absolute right-3 top-2 text-sm text-gray-500">
                                    {formatPercentage(shareAmount)}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setIsShareDialogOpen(false)}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleShareConfirm}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Increase Registered Capital Dialog */}
            {isCapitalDialogOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full m-4">
                        <h2 className="text-xl font-bold mb-4">Increase Registered Capital</h2>
                        <p className='p-4'>
                            Before performing the operation, you should first approve the testToken.<br />
                            By increasing the registered capital, you can raise the salary adjustment limit.
                        </p>
                        <input
                            type="number"
                            value={capitalAmount}
                            onChange={(e) => setCapitalAmount(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="Enter capital amount"
                        />

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setIsCapitalDialogOpen(false)}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        let capitalAmountWithDecimals = ethers.utils.parseUnits(capitalAmount.toString(), assetsDecimals);
                                        // console.log(capitalAmountWithDecimals)
                                        await publicV4626Contract.increaseRegisteredCapital(capitalAmountWithDecimals);
                                    } catch (error) {
                                        console.error('Error executing transaction:', error);
                                    }
                                    setIsCapitalDialogOpen(false);
                                    setCapitalAmount('');
                                }}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* List Publicly Dialog */}
            {isListPublicDialogOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full m-4">
                        <h2 className="text-xl font-bold mb-4">List Publicly</h2>

                        <p className="text-gray-700 mb-4">
                            Once the company status is converted to public, it cannot be reversed back to private mode.
                        </p>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setIsListPublicDialogOpen(false)}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        await publicV4626Contract.turnPublic();
                                    } catch (error) {
                                        console.error('Error executing transaction:', error);
                                    }
                                    setIsListPublicDialogOpen(false);
                                }}
                                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit Salary Modification Request Dialog */}
            {isSalarySubmitDialogOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full m-4">
                        <h2 className="text-xl font-bold mb-4">Submit Salary Modification Request</h2>
                        <p className='p-2'>
                            The maximum salary modification amount
                            that can be submitted is the sum of 10% of the current expenditure
                            and the total registered capital: {maxSalary}.
                            If you wish to increase the limit,
                            you can either wait for the existing request to be completed or increase the registered capital.</p>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={salaryCreator}
                                onChange={(e) => setSalaryCreator(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded"
                                placeholder="Enter Creator Address"
                            />

                            <input
                                type="number"
                                value={salaryAmount}
                                onChange={(e) => setSalaryAmount(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded"
                                placeholder="Enter Salary Amount"
                            />
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setIsSalarySubmitDialogOpen(false)}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        let salaryAmountWithDecimals = ethers.utils.parseUnits(salaryAmount.toString(), assetsDecimals);
                                        // console.log(capitalAmountWithDecimals)
                                        await publicV4626Contract.updateSalary(salaryCreator, salaryAmountWithDecimals);
                                    } catch (error) {
                                        console.error('Error executing transaction:', error);
                                    }
                                    setIsSalarySubmitDialogOpen(false);
                                    setSalaryCreator('');
                                    setSalaryAmount('');
                                }}
                                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Complete Salary Modification Request Dialog */}
            {isCompleteSalaryDialogOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full m-4">
                        <h2 className="text-xl font-bold mb-4">Complete Salary Modification Request</h2>
                        <p></p>
                        <input
                            type="text"
                            value={salaryCreator}
                            onChange={(e) => setSalaryCreator(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="Enter Creator Address"
                        />

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setIsCompleteSalaryDialogOpen(false)}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        await publicV4626Contract.finishUpdate(salaryCreator);
                                    } catch (error) {
                                        console.error('Error executing transaction:', error);
                                    }
                                    setIsCompleteSalaryDialogOpen(false);
                                    setSalaryCreator('');
                                }}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerManagementPanel;