import { web3, Program } from "@coral-xyz/anchor";
import idl from "../interface/habit_tracker.json";
import { HabitTracker } from "../interface/habit_tracker";
import { useProvider } from "./useProvider";

const programID = new web3.PublicKey(idl.metadata.address);

export const useProgram = () => {
  const { provider } = useProvider();

  if (!provider) {
    return null;
  }

  const program = new Program<HabitTracker>(idl as unknown as HabitTracker, programID, provider);

  return program;
};
