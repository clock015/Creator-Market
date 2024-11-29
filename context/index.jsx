import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import { CreatorMarketRouterABI, PaymentSplitABI, PublicV4626ABI, CreatorMarketRouterADDRESS } from '../contract';
import { MYERC20ABI, MYERC20ADDRESS } from '../contract';

const GlobalContext = createContext();

export const GlobalContextProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [creatorMarketRouterContract, setCreatorMarketRouterContract] = useState(null);
  const [paymentSplitContract, setPaymentSplitContract] = useState(null);
  const [publicV4626Contract, setPublicV4626Contract] = useState(null);
  const [MYERC20Contract, setMYERC20Contract] = useState(null);

  const [provider, setProvider] = useState(null);
  const [chainId, setChainId] = useState(0);

  // 新地址状态
  const [paymentSplitAddress, setPaymentSplitAddress] = useState('');
  const [publicV4626Address, setPublicV4626Address] = useState('');

  const [publicV4626Owner, setPublicV4626Owner] = useState('');
  const [decimals, setDecimals] = useState(0);
  const [isPublic, setIsPublic] = useState(false);

  const [ownerShares, setOwnerShares] = useState(0);
  const [publicShares, setPublicShares] = useState(0);
  const [otherShares, setOtherShares] = useState(0);

  const [creatorAddress, setCreatorAddress] = useState('');
  const [companies, setCompanies] = useState([]);

  const [rawData, setRawData] = useState([]);
  const [futureSpsData, setFutureSpsData] = useState([]);
  const [salaryScheduled, setSalaryScheduled] = useState([]);
  const [salaryArray, setSalaryArray] = useState([]);

  const [limits, setLimits] = useState({
    maxDeposit: 0,
    maxMint: 0,
    maxWithdraw: 0,
    maxRedeem: 0,
  });

  const [assetsDecimals, setAssetsDecimals] = useState(0);
  const [balance, setBalance] = useState(0);

  const [isOwner, setIsOwner] = useState(false);

  // Router
  const router = useRouter();
  const fetchRouter = () => {
    const { companyAddress } = router.query;  // 获取 URL 中的 `address` 参数
    console.log("companyAddress", companyAddress);
    if (companyAddress) {
      setPaymentSplitAddress(companyAddress);
    }
  }

  const fetchLocalStorage = () => {
    const localPaymentSplitAddress = localStorage.getItem('paymentSplitAddress');
    // const localCreatorAddress = localStorage.getItem('creatorAddress');
    if (localPaymentSplitAddress) {
      setPaymentSplitAddress(localPaymentSplitAddress)
    }
    // if (localCreatorAddress) {
    //   setCreatorAddress(localCreatorAddress)
    // }
  }

  //* 获取地址
  const updateCurrentWalletAddress = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window?.ethereum?.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          console.log("accounts[0] ", accounts[0])
        }
      } catch (error) {
        alert("Please connect Wallet");
      }
    }

  };

  // 更换chain
  const switchChain = async () => {
    const currentChainId = await window?.ethereum?.request({ method: 'eth_chainId' });
    console.log(`当前chainId:${currentChainId}`);
    if (currentChainId !== "0xaa36a7") {
      await window?.ethereum?.request({
        method: 'wallet_switchEthereumChain',
        // params: [{ chainId: '0xaa36a7' }]
        params: [{ chainId: '0xaa36a7' }]
      })
    }
  };

  const setSmartContractAndProvider = async () => {
    updateCurrentWalletAddress();
    switchChain();

    // 使用测试地址
    const testPaymentSplitAddress = '0x1a03146780e7fb9e60e3709FA1373EcD970cdAdf'
    fetchLocalStorage();
    if (!paymentSplitAddress) {
      setPaymentSplitAddress(testPaymentSplitAddress)
    }
    fetchRouter();

    const newChainId = await window?.ethereum?.request({ method: 'eth_chainId' });
    if (newChainId) setChainId(parseInt(newChainId, 16));
    if (window.ethereum) {
      const newProvider = new ethers.providers.Web3Provider(window.ethereum);
      console.log(newProvider)
      setProvider(newProvider);
      // 请求用户授权连接到其钱包
      try {
        const signer = newProvider.getSigner();
        // 在这里可以执行与用户钱包交互的操作
        console.log(signer)
        // 新router合约
        const newCreatorMarketRouterContract = new ethers.Contract(
          CreatorMarketRouterADDRESS,
          CreatorMarketRouterABI,
          signer
        );
        setCreatorMarketRouterContract(newCreatorMarketRouterContract);
        console.log(newCreatorMarketRouterContract)

        const newMYERC20Contract = new ethers.Contract(
          MYERC20ADDRESS,
          MYERC20ABI,
          signer
        );
        setMYERC20Contract(newMYERC20Contract);

        // 更新PaymentSplit和PublicV4626合约
        if (paymentSplitAddress) {
          const newPaymentSplitContract = new ethers.Contract(
            paymentSplitAddress,
            PaymentSplitABI,
            signer
          );
          setPaymentSplitContract(newPaymentSplitContract);
          console.log(newPaymentSplitContract)
        }
        if (publicV4626Address) {
          const newPublicV4626Contract = new ethers.Contract(
            publicV4626Address,
            PublicV4626ABI,
            signer
          );
          setPublicV4626Contract(newPublicV4626Contract);
          console.log(newPublicV4626Contract)
        }
        console.log('授权成功');
      } catch (e) {
        console.error('授权失败:', e);
      };
    } else {
      console.error('未检测到区块链钱包');
    }
  }

  // 单独更新PaymentSplit和PublicV4626合约
  const updatePaymentSplitContract = async (provider) => {
    if (!provider) return;
    if (paymentSplitAddress) {
      const newPaymentSplitContract = new ethers.Contract(
        paymentSplitAddress,
        PaymentSplitABI,
        provider.getSigner()
      );
      setPaymentSplitContract(newPaymentSplitContract);
      console.log(newPaymentSplitContract)
    }
  };
  const updatePublicV4626Contract = async (provider) => {
    if (!provider) return;
    if (publicV4626Address) {
      const newPublicV4626Contract = new ethers.Contract(
        publicV4626Address,
        PublicV4626ABI,
        provider.getSigner()
      );
      setPublicV4626Contract(newPublicV4626Contract);
    }
  };

  // 根据PaymentSplit合约更新publicV4626Address
  const updatePublicV4626Address = async () => {
    if (!creatorMarketRouterContract) return;
    // 调用 CreatorMarketRouter 合约的 equityOf 方法
    const equity = await creatorMarketRouterContract.equityOf(
      paymentSplitAddress
    );

    setPublicV4626Address(equity);
  };

  // 更新paymentSplit合约的shares比例
  const fetchContractShares = async () => {
    if (!paymentSplitContract) return;
    if (!decimals) return;
    if (!publicV4626Owner) return;
    try {
      // 调用 owner() 方法
      const ownerShares = await paymentSplitContract.balanceOf(publicV4626Owner);
      let ownerSharesN = parseFloat(
        ethers.utils.formatUnits(ownerShares, 10)
      ).toFixed(8) / 100000000
      setOwnerShares(ownerSharesN);
      console.log("Owner shares is ", ownerSharesN)

      // 调用 decimals() 方法
      const publicShares = await paymentSplitContract.balanceOf(publicV4626Address);
      let publicSharesN = parseFloat(
        ethers.utils.formatUnits(publicShares, 10)
      ).toFixed(8) / 100000000
      setPublicShares(publicSharesN);
      console.log("Public shares is ", publicSharesN)

      // 调用 isPublic() 方法
      const totalSupply = await paymentSplitContract.totalSupply();
      let totalSupplyN = parseFloat(
        ethers.utils.formatUnits(totalSupply, 10)
      ).toFixed(8) / 100000000
      let otherSharesN = totalSupplyN - ownerSharesN - publicSharesN;
      setOtherShares(otherSharesN);
      console.log("Other shares is ", otherSharesN)

    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // 更新publicV4626合约的状态
  const fetchContractDetails = async () => {
    if (!publicV4626Contract) return;
    try {
      // 调用 owner() 方法
      const contractOwner = await publicV4626Contract.owner();
      setPublicV4626Owner(contractOwner);
      console.log("owner is ", contractOwner)

      // 调用 decimals() 方法
      const contractDecimals = await publicV4626Contract.decimals();
      setDecimals(contractDecimals);
      // 调用 isPublic() 方法
      const contractIsPublic = await publicV4626Contract.isPublic();
      setIsPublic(contractIsPublic);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // 获取assets的details
  const fetchAssetsDetails = async () => {
    if (!MYERC20Contract) return;
    try {
      // 调用 decimals() 方法
      const newAssetsDecimals = await MYERC20Contract.decimals();
      setAssetsDecimals(newAssetsDecimals);
      console.log("AssetsDecimals is ", newAssetsDecimals)
      // 调用 isPublic() 方法
      const newBalance = await MYERC20Contract.balanceOf(walletAddress);
      const formattedBalance = ethers.utils.formatUnits(newBalance, newAssetsDecimals);
      setBalance(formattedBalance);
      console.log("Balance is ", formattedBalance)
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // 获取Assets和Shares曲线
  const fetchTotalAssetsAndSupplyUpdated = async () => {
    if (!publicV4626Contract) return;
    if (!decimals) return;
    let topic = ethers.utils.id("TotalAssetsAndSupplyUpdated(uint256,uint256,uint256)");
    // 获取 TotalAssetsAndSupplyUpdated 事件数据
    let filter = {
      address: publicV4626Address,
      topics: [topic],
      fromBlock: 0, // 从合约部署的区块开始
      toBlock: "latest", // 到最新区块
    }
    let iface = new ethers.utils.Interface(PublicV4626ABI);
    console.log(filter)
    if (!filter) {
      return;
    }
    try {
      provider
        .getLogs(filter)
        .then((events) => {
          const processedData = events.map((event) => {
            const parsedLog = iface.parseLog({
              topics: event.topics,
              data: event.data,
            });
            const { time, totalAssets, totalSupply } = parsedLog.args;

            // 根据 decimals 处理 totalSupply 和 totalAssets
            const formattedTotalSupply = ethers.utils.formatUnits(totalSupply, decimals - 2);
            const formattedTotalAssets = ethers.utils.formatUnits(totalAssets, decimals - 10); // 处理 totalAssets 为 decimals - 8 位

            return {
              timestamp: time.toNumber(),
              assets: parseFloat(formattedTotalAssets).toFixed(2) / 100,  // 保留两位小数
              shares: parseFloat(formattedTotalSupply).toFixed(2) / 100,  // 保留两位小数
            };
          });

          setRawData(processedData);
        });
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // 拉取工资更改事件
  const fetchSalaryUpdated = async () => {
    if (!publicV4626Contract) return;
    if (!decimals) return;
    try {
      // 获取 SalaryUpdateScheduled 事件的日志
      const topic = ethers.utils.id(
        "SalaryUpdateFinished(address,uint256,uint256)"
      );
      const filter = {
        address: publicV4626Contract.address,
        topics: [topic],
        fromBlock: 0, // 从合约部署的区块开始
        toBlock: "latest", // 到最新区块
      };

      // 获取日志数据
      const logs = await provider.getLogs(filter);

      // 解析日志数据
      const iface = new ethers.utils.Interface(PublicV4626ABI);
      const parsedLogs = logs.map((log) => iface.parseLog(log));

      let salaryUpdateFinished = []
      // 过滤出未生效的事件（updateTime > 当前时间）
      parsedLogs.forEach(
        (event) => {
          let { creator, amount, timestamp } = event.args;
          timestamp = timestamp.toNumber()
          amount = parseFloat(
            ethers.utils.formatUnits(amount, decimals - 8)
          )
          salaryUpdateFinished.push({ creator, amount, timestamp })
        }
      );
      console.log(salaryUpdateFinished)

      // 合并工资更改事件数组
      let salaryUpdateArray = [];

      // 合并两个数组的指针，用于循环
      let i = 0, j = 0;

      while (i < salaryScheduled.length || j < salaryUpdateFinished.length) {

        let aObj = salaryScheduled[i];
        let bObj = salaryUpdateFinished[j];

        if (!bObj || (aObj && aObj.updateTime <= bObj.timestamp)) {
          // A 数组的对象更早或 B 数组已经遍历完
          let newObj = { ...aObj, finishTime: 0 };
          salaryUpdateArray.push(newObj);
          i++;
        } else {
          // B 数组的对象更早
          let matchObj = salaryUpdateArray.find(obj => obj.creator === bObj.creator && obj.finishTime === 0);

          if (matchObj) {
            // 如果找到 creator 相同且 updateTime 为 0 的对象
            matchObj.finishTime = bObj.timestamp;  // 更新该对象的 updateTime
          }

          j++;
        }
      }

      console.log("salaryUpdateArray", salaryUpdateArray);
      setSalaryArray(salaryUpdateArray)

    } catch (error) {
      console.error("Error fetchSalaryUpdated:", error);
      return [];
    }
  }

  // 计算未来支出曲线
  const calculateFutureSps = async () => {
    if (!publicV4626Contract) return;
    if (!decimals) return;

    try {
      // 获取区块链当前时间
      const currentBlock = await provider.getBlock("latest"); // 获取最新区块
      const currentTime = currentBlock.timestamp; // 当前区块链时间（单位：秒）

      // 获取当前 totalSps
      const currentTotalSps = await publicV4626Contract.totalSps();

      // 初始化结果数据
      let futureSpsData = [
        {
          time: currentTime,
          totalSps:
            parseFloat(
              ethers.utils.formatUnits(currentTotalSps, decimals - 8)
            ), // 保留2位小数
        },
      ];

      // 获取 SalaryUpdateScheduled 事件的日志
      const topic = ethers.utils.id(
        "SalaryUpdateScheduled(address,uint256,uint256,uint256)"
      );
      const filter = {
        address: publicV4626Contract.address,
        topics: [topic],
        fromBlock: 0, // 从合约部署的区块开始
        toBlock: "latest", // 到最新区块
      };

      // 获取日志数据
      const logs = await provider.getLogs(filter);


      // 解析日志数据
      const iface = new ethers.utils.Interface(PublicV4626ABI);
      const parsedLogs = logs.map((log) => iface.parseLog(log));

      let salaryUpdateScheduled = []
      // 过滤出未生效的事件（updateTime > 当前时间）
      const futureEvents = parsedLogs.filter(
        (event) => {
          let { creator, updateTime, currentAmount, pendingAmount } = event.args;
          updateTime = updateTime.toNumber()
          currentAmount = parseFloat(
            ethers.utils.formatUnits(currentAmount, decimals - 8)
          )
          pendingAmount = parseFloat(
            ethers.utils.formatUnits(pendingAmount, decimals - 8)
          )
          salaryUpdateScheduled.push({ creator, updateTime, currentAmount, pendingAmount })
          if (event.args.updateTime.toNumber() > currentTime) return true;
        }
      );
      setSalaryScheduled(salaryUpdateScheduled)

      // 计算未来的 totalSps
      let previousTotalSps =
        parseFloat(
          ethers.utils.formatUnits(currentTotalSps, decimals - 8)
        ); // 转换为浮点数

      for (const event of futureEvents) {
        const { updateTime, currentAmount, pendingAmount } = event.args;

        // 计算 currentSps 和 pendingSps
        const currentSps =
          parseFloat(
            ethers.utils.formatUnits(currentAmount, decimals - 8)
          ) / 86400 / 30; // currentAmount 换算为每秒
        const pendingSps =
          parseFloat(
            ethers.utils.formatUnits(pendingAmount, decimals - 8)
          ) / 86400 / 30; // pendingAmount 换算为每秒

        // 计算下一个 totalSps
        const nextTotalSps = previousTotalSps - currentSps + pendingSps;

        // 添加数据到结果
        futureSpsData.push({
          time: updateTime.toNumber(),
          totalSps: nextTotalSps, // 保留2位小数
        });

        // 更新 previousTotalSps 为下一个 totalSps
        previousTotalSps = nextTotalSps;
      }

      setFutureSpsData(futureSpsData);
    } catch (error) {
      console.error("Error calculating future totalSps:", error);
      return [];
    }
  };

  // 更新maxDeposit, maxMint, maxWithdraw, maxRedeem
  const updateLimits = async () => {

    if (!publicV4626Contract) return;
    if (!decimals) return;

    const [rawMaxDeposit, rawMaxMint, rawMaxWithdraw, rawMaxRedeem] = await Promise.all([
      publicV4626Contract.maxDeposit(walletAddress),
      publicV4626Contract.maxMint(walletAddress),
      publicV4626Contract.maxWithdraw(walletAddress),
      publicV4626Contract.maxRedeem(walletAddress),
    ]);

    const maxDeposit = parseFloat(ethers.utils.formatUnits(rawMaxDeposit, decimals - 10)).toFixed(2) / 100;
    const maxMint = parseFloat(ethers.utils.formatUnits(rawMaxMint, decimals - 2)).toFixed(2) / 100;
    const maxWithdraw = parseFloat(ethers.utils.formatUnits(rawMaxWithdraw, decimals - 10)).toFixed(2) / 100;
    const maxRedeem = parseFloat(ethers.utils.formatUnits(rawMaxRedeem, decimals - 2)).toFixed(2) / 100;

    setLimits({
      maxDeposit: maxDeposit,
      maxMint: maxMint,
      maxWithdraw: maxWithdraw,
      maxRedeem: maxRedeem,
    });
  };

  // 获取 creator 的公司地址数组
  const fetchCompanies = async () => {
    try {
      if (!creatorAddress || !creatorMarketRouterContract) {
        console.warn("Creator address or contract is missing.");
        return;
      }
      console.log(creatorMarketRouterContract)
      // 调用合约方法
      const companyAddresses = await creatorMarketRouterContract.getCompaniesFoundedBy(creatorAddress);
      console.log(companyAddresses)

      // 设置状态
      setCompanies(companyAddresses);
      console.log('Companies fetched successfully:', companyAddresses);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  useEffect(() => {
    if (walletAddress && publicV4626Owner) {
      const standardizedAddress1 = ethers.utils.getAddress(walletAddress);
      const standardizedAddress2 = ethers.utils.getAddress(publicV4626Owner);
      setIsOwner(standardizedAddress1 === standardizedAddress2);
    }
  }, [walletAddress, publicV4626Owner]);

  // 每次打开页面更新钱包
  useEffect(() => {
    setSmartContractAndProvider();

    window?.ethereum?.on('chainChanged', setSmartContractAndProvider);
    window?.ethereum?.on('accountsChanged', updateCurrentWalletAddress);
  }, []);

  useEffect(() => {
    fetchAssetsDetails();
  }, [MYERC20Contract, provider]);

  // 每次paymentSplitAddress或publicV4626Address更新时只更新相关合约
  useEffect(() => {
    localStorage.setItem('paymentSplitAddress', paymentSplitAddress);
    updatePaymentSplitContract(provider);
  }, [paymentSplitAddress, provider]);

  useEffect(() => {
    updatePublicV4626Contract(provider);
  }, [publicV4626Address, provider]);

  useEffect(() => {
    fetchContractShares();
  }, [paymentSplitContract, decimals, publicV4626Address]);

  useEffect(() => {
    updatePublicV4626Address();
  }, [paymentSplitContract]);

  useEffect(() => {
    fetchContractDetails();
    fetchTotalAssetsAndSupplyUpdated();
    updateLimits();
    calculateFutureSps();
  }, [publicV4626Contract, decimals]);

  useEffect(() => {
    fetchSalaryUpdated();
  }, [salaryScheduled]);

  useEffect(() => {
    localStorage.setItem('creatorAddress', creatorAddress);
    fetchCompanies();
  }, [creatorAddress]);

  return (
    <GlobalContext.Provider
      value={{
        creatorMarketRouterContract,
        paymentSplitContract,
        publicV4626Contract,
        MYERC20Contract,
        provider,
        chainId,
        walletAddress,
        setSmartContractAndProvider,
        paymentSplitAddress,
        setPaymentSplitAddress,
        publicV4626Address,
        setPublicV4626Address,
        publicV4626Owner,
        isPublic,
        ownerShares,
        publicShares,
        otherShares,
        creatorAddress,
        setCreatorAddress,
        companies,
        rawData,
        futureSpsData,
        limits,
        balance,
        assetsDecimals,
        fetchAssetsDetails,
        decimals,
        isOwner,
        salaryArray
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);
