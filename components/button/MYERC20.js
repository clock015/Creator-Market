// src/components/TokenActions.js
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useGlobalContext } from '../../context';

const TokenOperations = () => {
  const {
    MYERC20Contract,
    paymentSplitAddress,
    publicV4626Address,
    balance,
    assetsDecimals,
    fetchAssetsDetails
  } = useGlobalContext();
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [approveAmount, setApproveAmount] = useState('10000');
  const [approveSpender, setApproveSpender] = useState(publicV4626Address);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTo, setTransferTo] = useState(paymentSplitAddress);

  const handleMint = async () => {
    try {
      await MYERC20Contract.mint();
      alert("Mint function submitted");
    } catch (error) {
      alert("Mint transaction failed");
    }
  };

  const handleApprove = async () => {
    try {
      const formattedAmount = ethers.utils.parseUnits(approveAmount, assetsDecimals);
      await MYERC20Contract.approve(approveSpender, formattedAmount);
      console.log(`Approving ${formattedAmount} to spender ${approveSpender}`);
      alert("Approve transaction submitted");
      setShowApproveModal(false);
    } catch (error) {
      alert("Approve transaction failed");
    }
  };

  const handleTransfer = async () => {
    try {
      const formattedAmount = ethers.utils.parseUnits(transferAmount, assetsDecimals);
      await MYERC20Contract.transfer(transferTo, formattedAmount);
      console.log(`Transferring ${formattedAmount} to ${transferTo}`);
      alert("Transfer transaction submitted");
      fetchAssetsDetails();
      setShowTransferModal(false);
    } catch (error) {
      alert("Transfer transaction failed");
    }
  };

  return (
    <div className="p-4 shadow-lg rounded-lg max-w-lg sm:w-3/4 my-4 flex flex-col space-y-4">
      <h1 className="text-4xl mb-4">testToken Operations</h1>
      <button
        onClick={handleMint}
        className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded"
      >
        Mint Tokens
      </button>

      <button
        onClick={() => {
          setShowApproveModal(true);
          setApproveSpender(publicV4626Address);
        }}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
      >
        Approve Tokens
      </button>

      <button
        onClick={() => {
          setShowTransferModal(true);
          setTransferTo(paymentSplitAddress);
        }}
        className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded"
      >
        Transfer Tokens
      </button>

      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl mb-4">Approve Tokens</h2>
            <h3 className="text-l mb-4">Your balance is {balance}</h3>
            <div className="mb-4">
              <label className="block mb-2">Amount</label>
              <input
                type="text"
                value={approveAmount}
                onChange={(e) => setApproveAmount(e.target.value)}
                className="w-full border rounded p-2"
                placeholder="Enter amount (default 10000)"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Spender (default: current public company)</label>
              <input
                type="text"
                value={approveSpender}
                onChange={(e) => setApproveSpender(e.target.value)}
                className="w-full border rounded p-2"
                placeholder="Enter spender address (default 0x0)"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowApproveModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-black py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl mb-4">Transfer Tokens</h2>
            <h3 className="text-l mb-4">Your balance is {balance}</h3>
            <div className="mb-4">
              <label className="block mb-2">Amount</label>
              <input
                type="text"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full border rounded p-2"
                placeholder="Enter transfer amount"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">To Address (default: current private company)</label>
              <input
                type="text"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                className="w-full border rounded p-2"
                placeholder="Enter recipient address (default 0x0)"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowTransferModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-black py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenOperations;