import { Type } from "../../types/types";

export enum CategoryType {
  BEACH = "BEACH",
  MOUNTAIN = "MOUNTAIN",
  FOREST = "FOREST",
  CAMPING = "CAMPING",
}

export function validateEnum(value: string, enumObject: Object): boolean {
  return Object.values(enumObject).includes(value);
}
