import React, { useState } from 'react';
import { useGlobalContext } from '../context';

const AddressCompanySelector = () => {
    const {
        creatorAddress,
        setCreatorAddress,
        companies,
        paymentSplitAddress,
        setPaymentSplitAddress
    } = useGlobalContext();
    const [isOpen, setIsOpen] = useState(false);

    // 处理地址输入变化
    const handleAddressChange = (e) => {
        setCreatorAddress(e.target.value);
    };

    // 处理公司选择变化
    const handleCompanyChange = (company) => {
        setPaymentSplitAddress(company);
        setIsOpen(false);
    };

    return (
        <div className="space-y-4 w-full max-w-md mx-auto bg-white shadow-lg rounded-lg p-6 ">
            <h2 className="text-xl font-bold mb-4">Company Selector</h2>
            {/* 地址输入框 */}
            <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">
                    owner address(Please enter the address to initiate the 'new your company' transaction.)
                </label>
                <input
                    id="address"
                    type="text"
                    placeholder="Please input owner address"
                    value={creatorAddress}
                    onChange={handleAddressChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* 公司选择下拉框 */}
            <div className="space-y-2 relative">
                <label className="text-sm font-medium">
                    Select Company
                </label>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-full px-3 py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        {paymentSplitAddress || 'Please Select Company'}
                    </button>

                    {isOpen && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto z-10">
                            {companies.map((company, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleCompanyChange(company.name || company)}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                >
                                    {company.name || company}
                                </div>
                            ))}
                            {companies.length === 0 && (
                                <div className="px-3 py-2 text-gray-500">
                                    null
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddressCompanySelector;