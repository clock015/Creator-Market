import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useGlobalContext } from '../../context';

const ReleasableFundsContainer = () => {
    const {
        publicV4626Contract,
    } = useGlobalContext();
    const [address, setAddress] = useState('');
    const [releasable, setReleasable] = useState('0');

    // 每当地址改变时更新可释放金额
    useEffect(() => {
        const updateReleasable = async () => {
            if (ethers.utils.isAddress(address)) {
                try {
                    const amount = await publicV4626Contract.releasable(address);
                    setReleasable(ethers.utils.formatEther(amount));
                } catch (error) {
                    console.error('Error fetching releasable amount:', error);
                    setReleasable('0');
                }
            }
        };

        updateReleasable();
    }, [address, publicV4626Contract]);

    const handleRelease = async () => {
        if (!ethers.utils.isAddress(address)) {
            alert('Please enter a valid Ethereum address');
            return;
        }

        try {
            await publicV4626Contract.release(address);
        } catch (error) {
            console.error('Error executing release:', error);
        }
    };

    return (
        <div className="p-6 space-y-4 max-w-md mx-auto bg-white shadow-lg rounded-lg">
            <div className="space-y-4">
                <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="Enter Ethereum address"
                />

                <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-blue-700">
                        Your address's releasable funds are {releasable} ETH.
                    </p>
                </div>

                <button
                    onClick={handleRelease}
                    className="w-full bg-blue-500 text-white hover:bg-blue-600 p-3 rounded-lg font-medium"
                >
                    Release Funds
                </button>
            </div>
        </div>
    );
};

export default ReleasableFundsContainer;