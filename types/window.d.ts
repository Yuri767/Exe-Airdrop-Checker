// types/window.d.ts
export interface SolanaProvider {
  isPhantom?: boolean;
  connect: () => Promise<void>;
  publicKey?: import('@solana/web3.js').PublicKey;
  signTransaction?: (tx: any) => Promise<any>;
}

declare global {
  interface Window {
    solana?: SolanaProvider;
  }
}
