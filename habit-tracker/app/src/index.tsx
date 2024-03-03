import "./index.css";
import React from "react";
import ReactDOM from 'react-dom/client';
import App from "./App";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { Buffer } from "buffer";
import reportWebVitals from './reportWebVitals';
import { useEndpoint } from "./hooks/useEndpoint";
global.Buffer = Buffer;

const wallets = [
  new PhantomWalletAdapter(),
];

const SolanaApp = () => {
  const endpoint = useEndpoint();
  
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <SolanaApp />
  </React.StrictMode>
);

reportWebVitals();