type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type Index = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export class CellPosition {
  readonly row: Index
  readonly column: Index

  constructor(row: Index, column: Index) {
    this.row = row
    this.column = column
  }

  boxIdx(): Index {
    const yBoxIdx = Math.floor(this.row / 3)
    const xBoxIdx = Math.floor(this.column / 3)
    return (yBoxIdx * 3 + xBoxIdx) as Index
  }
}

export const allIndices = (): Index[] => {
  return [0, 1, 2, 3, 4, 5, 6, 7, 8]
}

export const allDigits = (): Digit[] => {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9]
}
