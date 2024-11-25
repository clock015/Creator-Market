import Head from 'next/head';
import Image from 'next/image';
import styles from './layout.module.css';
import Link from 'next/link';

import React from 'react';

import { useGlobalContext } from '../context';

export const siteTitle = 'My web3 website';

export default function Layout({ children, home }) {
  const { walletAddress, setSmartContractAndProvider } = useGlobalContext();

  return (
    <div className="layout">
      {/* 标签页名称 */}
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Learn how to build a personal website using Next.js"
        />
        <meta
          property="og:image"
          content={`https://og-image.vercel.app/${encodeURI(
            siteTitle,
          )}.png?theme=light&md=0&fontSize=75px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fnextjs-black-logo.svg`}
        />
        <meta name="og:title" content={siteTitle} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      {/* header */}
      <div
        className='flex bg-black box-content h-10 p-4'
      >
        <Link href="/">
          <Image
            priority
            src="/testLogo.png"
            height={60}
            width={120}
            alt=""
          />
        </Link>
        <div className='grow'></div>
        <div className='flex'>
          {(!walletAddress) ?
            <button className='w-40 text-blue-600 bg-blue-200 font-semibold rounded-full flex items-center justify-center' onClick={setSmartContractAndProvider}>
              Connect Wallet
            </button>
            :
            <button className='w-40 text-blue-600 bg-blue-200 font-semibold rounded-full flex items-center justify-center' onClick={setSmartContractAndProvider}>
              {walletAddress.substring(0, 6) + '...' + walletAddress.substring(38)}
            </button>}
        </div>
      </div>
      <div
        className="site-layout-content box-content p-4"
      >
        {children}
      </div>
      <div
        style={{
          textAlign: 'center',
        }}
      >
        {!home && (
          <div className={styles.backToHome}>
            <Link href="/">← Back to home</Link>
          </div>
        )}
      </div>
    </div>
  );
}