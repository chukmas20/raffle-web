export type MachineWinner = {
  id: string;
  number: string;
  name: string | null;
  position: number;
};

export type SpinOutcome =
  | { ok: true; winner: MachineWinner; drawn: number; total: number }
  | { ok: false; message: string };