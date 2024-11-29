// pages页面下所有页面会自动创建网络路由

import Head from 'next/head';
import Layout, { siteTitle } from '../components/layout';
import Link from 'next/link';
import { useState } from 'react';

import { useGlobalContext } from '../context';

import FutrueExpense from '../components/futrueExpense';
import TimeScaledCharts from '../components/assetsAndShares';
import SharesPieChart from '../components/sharesPieChart';
import AddressCompanySelector from '../components/companySelector';
import SalaryUpdateTable from '../components/SalaryUpdateList';

import { TokenOperations, TradingPanel, OwnerManagementPanel, ReleasableFundsContainer, NewCompanyButton } from '../components/button';

export default function Home({ }) {

  const {
    contract,
    chainId,
    creatorMarketRouterContract,
    paymentSplitContract,
    publicV4626Contract,
    paymentSplitAddress,
    setPaymentSplitAddress,
    publicV4626Address,
    setPublicV4626Address,
    publicV4626Owner
  } = useGlobalContext();
  const [count, setCount] = useState(0);



  return (
    <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <div className="flex flex-col items-center">
        <div className='shadow-lg rounded-lg p-4 w-full sm:w-3/4 my-4'>
          The contract deployed on Sepolia testnet,and the chainId is 11155111.<br />
          <Link href={"https://github.com/clock015/Creator-Market"}>
            <p className='text-blue-600'>Click here to go to the smart contract repository.</p>
          </Link>
          Your current chainId is {chainId}
        </div>
        <div className='p-4 flex items-center font-semibold shadow-lg rounded-lg w-full sm:w-3/4 my-4'>
          <div className='w-full min-h-fit px-2 py-2 rounded-full flex items-center'>
            The private part of the company is {paymentSplitAddress}, <br />
            and the public part of the company is {publicV4626Address}.
          </div>
        </div>
        <div className='p-4 flex items-center font-semibold shadow-lg rounded-lg w-full sm:w-3/4 my-4'>
          <div className='w-full min-h-fit px-2 py-2 rounded-full flex items-center'>
            <div>
              <h2 className="text-xl font-bold">Tutorial: </h2>
              <p>
                1.New your company.<br />
                2.Use the company selector to find your company.<br />
                3.Mint and Approve the test Token.<br />
                4.Increase public shares to allocate shares to your shareholders.<br />
                5.Increase registered capital to raise the salary limit.<br />
                6.Submit salary modification request to hire employees.<br />
                7.Complete salary modification request to confirm hiring (wait 1 day in test mode, 30 days in the official version).<br />
                8.List publicly to enable trading functionality.<br />
                9.Try the trading module.<br />
              </p>
            </div>
          </div>
        </div>
        <TokenOperations></TokenOperations>
        <div className='p-4'>
          <NewCompanyButton></NewCompanyButton>
        </div>

        <div className="container" style={{ backgroundColor: '#e0f7fa', padding: '20px', marginBottom: '20px' }}>
          <h6 className="company-title text-5xl font-semibold text-gray-800">Company Dashboard</h6>

          <div className="chart-container p-4" >
            <AddressCompanySelector></AddressCompanySelector>
          </div>

          <div className="chart-container p-4" >
            <p>current company owner is {publicV4626Owner}</p>
          </div>

          <div className="chart-container p-4" >
            <SharesPieChart />
          </div>

          <div className="chart-container p-4" >
            <FutrueExpense />
          </div>

          <div className="chart-container p-4" >
            <TimeScaledCharts />
          </div>

          <div className="chart-container p-4" >
            <TradingPanel></TradingPanel>
          </div>
          <div className="chart-container p-4" >
            <OwnerManagementPanel></OwnerManagementPanel>
          </div>
          <div className="chart-container p-4" >
            <SalaryUpdateTable></SalaryUpdateTable>
          </div>
          <div className="chart-container p-4" >
            <ReleasableFundsContainer></ReleasableFundsContainer>
          </div>
        </div>
      </div>
    </Layout >
  );
}