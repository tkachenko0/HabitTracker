import { clusterApiUrl } from "@solana/web3.js";

export const useEndpoint = () => {
    return "http://127.0.0.1:8899"
    //return clusterApiUrl("devnet");
    //return clusterApiUrl("testnet");
};