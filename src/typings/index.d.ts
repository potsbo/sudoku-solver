interface CellState {
  isInitial: boolean
  determined: number | null
  possibleNumbers: Set<number>
}

interface CellPosition {
  row: number
  column: number
}
