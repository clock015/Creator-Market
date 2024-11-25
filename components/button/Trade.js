import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useGlobalContext } from '../../context';

const TradingPanel = () => {
    const {
        isPublic,
        limits,
        walletAddress,
        publicV4626Contract,
        assetsDecimals,
        decimals
    } = useGlobalContext();
    const maxDeposit = limits.maxDeposit;
    const maxMint = limits.maxMint;
    const maxWithdraw = limits.maxWithdraw;
    const maxRedeem = limits.maxRedeem;

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [actionType, setActionType] = useState('');
    const [amount, setAmount] = useState(0);

    const DECIMALS = {
        deposit: assetsDecimals,
        withdraw: assetsDecimals,
        mint: decimals,
        redeem: decimals
    };

    const getMaxAmount = (action) => {
        switch (action) {
            case 'deposit':
                return maxDeposit;
            case 'mint':
                return maxMint;
            case 'withdraw':
                return maxWithdraw;
            case 'redeem':
                return maxRedeem;
            default:
                return 0;
        }
    };

    // 格式化数字为4位小数
    const formatNumber = (value) => {
        return Number(value).toFixed(4);
    };

    // 处理显示值（用于UI展示）
    const getDisplayValue = (value) => {
        return formatNumber(value);
    };

    const handleButtonClick = (action) => {
        setActionType(action);
        setAmount(0);
        setIsDialogOpen(true);
    };

    const handleSliderChange = (e) => {
        const value = parseFloat(e.target.value);
        setAmount(Number(formatNumber(value)));
    };

    const handleInputChange = (e) => {
        const inputValue = e.target.value;
        const value = parseFloat(inputValue);
        const maxAmount = getMaxAmount(actionType);

        if (!isNaN(value) && value >= 0 && value <= maxAmount) {
            // 限制输入到4位小数
            const formattedValue = inputValue.includes('.')
                ? value.toString().match(/^\d*\.?\d{0,4}/)[0]
                : value.toString();
            setAmount(Number(formattedValue));
        }
    };

    const handleConfirm = async () => {
        const decimals = DECIMALS[actionType];
        const valueWithDecimals = ethers.utils.parseUnits(amount.toString(), decimals);

        try {
            switch (actionType) {
                case 'deposit':
                    // 调用合约的 deposit 方法
                    await publicV4626Contract.deposit(valueWithDecimals, walletAddress);
                    break;
                case 'mint':
                    await publicV4626Contract.mint(valueWithDecimals, walletAddress);
                    break;
                case 'withdraw':
                    await publicV4626Contract.withdraw(valueWithDecimals, walletAddress);
                    break;
                case 'redeem':
                    await publicV4626Contract.redeem(valueWithDecimals, walletAddress);
                    break;
                default:
                    console.error('Invalid action type');
            }
        } catch (error) {
            console.error('Error executing transaction:', error);
        }

        setIsDialogOpen(false);
    };

    const actionConfig = {
        deposit: {
            label: 'Deposit',
            max: maxDeposit,
            style: 'bg-blue-100 text-blue-600 hover:bg-blue-200'
        },
        mint: {
            label: 'Mint',
            max: maxMint,
            style: 'bg-green-100 text-green-600 hover:bg-green-200'
        },
        withdraw: {
            label: 'Withdraw',
            max: maxWithdraw,
            style: 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
        },
        redeem: {
            label: 'Redeem',
            max: maxRedeem,
            style: 'bg-purple-100 text-purple-600 hover:bg-purple-200'
        }
    };

    return (
        <div className="p-6 space-y-4 max-w-2xl mx-auto bg-white shadow-lg rounded-lg">
            < div className={`p-4 ${isPublic ? 'bg-green-50' : 'bg-red-50'} rounded-lg mb-4`} >
                <p className={`${isPublic ? 'text-green-700' : 'text-red-700'}`}>
                    {isPublic
                        ? "The company is publicly listed and can be traded."
                        : "The company is not yet publicly listed and cannot be traded."
                    }
                </p>
            </div >

            {
                isPublic && (
                    <div>
                        <p className="text-gray-700 p-4">
                            Due to salary fluctuations, the buy and sell maximum values may not be completely accurate. Please try to leave some buffer from the max value.<br />
                            Before performing the operation, you should first approve the testToken.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(actionConfig).map(([action, config]) => (
                                <button
                                    key={action}
                                    onClick={() => handleButtonClick(action)}
                                    className={`${config.style} p-3 rounded-lg font-medium transition-colors duration-200 shadow-sm`}
                                >
                                    {config.label}
                                    <div className="text-sm mt-1">
                                        Max: {formatNumber(config.max)}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )
            }

            {
                isDialogOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full m-4">
                            <h2 className="text-xl font-bold mb-4">{actionConfig[actionType]?.label}</h2>

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>0.0000</span>
                                    <span>Max: {formatNumber(getMaxAmount(actionType))}</span>
                                </div>

                                <input
                                    type="range"
                                    value={amount}
                                    onChange={handleSliderChange}
                                    min={0}
                                    max={getMaxAmount(actionType)}
                                    step={0.0001} // 设置步进值为0.0001以支持4位小数
                                    className="w-full"
                                />

                                <div className="relative">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={handleInputChange}
                                        max={getMaxAmount(actionType)}
                                        min={0}
                                        step={0.0001} // 设置步进值为0.0001以支持4位小数
                                        className="w-full p-2 border border-gray-300 rounded"
                                        placeholder={`Enter amount (max: ${formatNumber(getMaxAmount(actionType))})`}
                                    />
                                    <div className="absolute right-3 top-2 text-sm text-gray-500">
                                        {getDisplayValue(amount)}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => setIsDialogOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Confirm {getDisplayValue(amount)}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default TradingPanel;