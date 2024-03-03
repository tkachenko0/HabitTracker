import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { HabitTracker } from "../target/types/habit_tracker";

anchor.setProvider(anchor.AnchorProvider.env());

export const connection = anchor.AnchorProvider.env().connection;
export const program = anchor.workspace.HabitTracker as Program<HabitTracker>;
