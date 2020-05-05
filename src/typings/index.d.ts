interface CellState {
  isInitial: boolean
  determined: number | null
  possibleNumbers: Set<number>
}
