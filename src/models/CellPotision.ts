export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type Index = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export class CellPosition {
  readonly row: Index
  readonly column: Index
  readonly boxIdx: Index

  constructor(row: Index, column: Index) {
    this.row = row
    this.column = column
    const yBoxIdx = Math.floor(this.row / 3)
    const xBoxIdx = Math.floor(this.column / 3)
    this.boxIdx = (yBoxIdx * 3 + xBoxIdx) as Index
  }
}

export const allIndices = (): Index[] => {
  return [0, 1, 2, 3, 4, 5, 6, 7, 8]
}

export const allDigits = (): Digit[] => {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9]
}

export type Interaction = (a: CellPosition, b: CellPosition) => boolean
export const sameBox = (a: CellPosition, b: CellPosition): boolean => {
  return a.boxIdx === b.boxIdx
}
export const sameColumn = (a: CellPosition, b: CellPosition): boolean => {
  return a.column === b.column
}
export const sameRow = (a: CellPosition, b: CellPosition): boolean => {
  return a.row === b.row
}

const calcInteraction = (a: CellPosition, b: CellPosition): boolean => {
  if (a.row === b.row && a.column === b.column) { return false }
  const interactions = [sameRow, sameColumn, sameBox]
  for (const interaction of interactions) {
    if (interaction(a, b)) {
      return true
    }
  }
  return false
}

export const interacts = (a: CellPosition, b: CellPosition): boolean => {
  return calcInteraction(a, b)
}

const allPositions: CellPosition[] = []
allIndices().forEach(row => {
  allIndices().forEach(column => {
    allPositions.push(new CellPosition(row, column))
  })
})

const interactionMap: CellPosition[][] = Array(allIndices().length * allIndices().length)

export const listInteractingPositions = (a: CellPosition): CellPosition[] => {
  const positions = interactionMap[a.row * 9 + a.column]
  if (positions !== undefined) { return positions }
  const calced = allPositions.filter(p => interacts(a, p))
  interactionMap[a.row * 9 + a.column] = calced
  return calced
}
