import React, { useState } from 'react';
import { useGlobalContext } from '../../context';

const NewCompanyButton = () => {
    const {
        setPaymentSplitAddress,
        setPublicV4626Address,
        creatorMarketRouterContract
    } = useGlobalContext();

    // 控制弹窗是否显示
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // 保存输入框的值
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');

    // 打开弹窗
    const handleButtonClick = () => {
        setIsDialogOpen(true);
    };

    // 关闭弹窗
    const handleClose = () => {
        setIsDialogOpen(false);
    };

    // 处理输入框值变化
    const handleNameChange = (e) => {
        setName(e.target.value);
    };

    const handleSymbolChange = (e) => {
        setSymbol(e.target.value);
    };

    // 确认按钮点击事件
    const handleConfirm = async () => {
        if (name && symbol) {
            try {
                console.log(`Dynamic function called with name: ${name}, symbol: ${symbol}`);
                // 你可以在这里调用一个智能合约的函数，或做其他处理
                const tx = await creatorMarketRouterContract.newCompany(name, symbol);
                const receipt = await tx.wait();
                console.log(receipt)
                // setPaymentSplitAddress(paymentSplitAddress);
            } catch (error) {
                console.error('Error executing transaction:', error);
            }
            setIsDialogOpen(false); // 关闭弹窗
        } else {
            alert('Please fill out both fields.');
        }
    };

    return (
        <div className="p-6 space-y-4 max-w-2xl mx-auto bg-white shadow-lg rounded-lg">
            {/* 显示按钮 */}
            <button
                onClick={handleButtonClick}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                New Your Company
            </button>

            {/* 弹窗 */}
            {isDialogOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full m-4">
                        <h2 className="text-xl font-bold mb-4">Enter Details</h2>
                        <div className="space-y-4">
                            {/* Name 输入框 */}
                            <div>
                                <label className="block text-sm text-gray-600">Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={handleNameChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder="Enter name"
                                />
                            </div>

                            {/* Symbol 输入框 */}
                            <div>
                                <label className="block text-sm text-gray-600">Symbol</label>
                                <input
                                    type="text"
                                    value={symbol}
                                    onChange={handleSymbolChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder="Enter symbol"
                                />
                            </div>
                        </div>

                        {/* Confirm 和 Cancel 按钮 */}
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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

export default NewCompanyButton;