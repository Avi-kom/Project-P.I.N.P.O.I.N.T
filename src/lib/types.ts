export type FloorId = 1 | 2 | 3 | 4;
export type RiskLevel = 1 | 2 | 3 | "Fixed";
export type PinStatus = "Pending" | "Approved" | "Rejected";

export interface Pin {
  id: string;
  floorId: FloorId;
  xCoord: number;
  yCoord: number;
  level: RiskLevel;
  description: string;
  photoUrl: string;
  status: PinStatus;
  building: string;
  synced: boolean;
  reporterName: string;
  reporterSection: string;
  reporterEmail: string;
}
