import { CellPosition } from './CellPotision'
import { Digit, allDigits } from './CellPotision'

export class CellData {
  needUpdate: boolean
  possibleNumbers: Set<Digit>
  position: CellPosition
  isInitial: boolean

  constructor(n: Digit | undefined, position: CellPosition) {
    this.needUpdate = true;
    this.possibleNumbers = new Set()
    this.position = position
    this.isInitial = false
    if (n !== undefined && n > 0) {
      this.possibleNumbers.add(n);
    } else {
      allDigits().forEach((n) => {
        this.possibleNumbers.add(n);
      })
    }
  }

  boxIdx(): number {
    const yBoxIdx = Math.floor(this.position.row / 3)
    const xBoxIdx = Math.floor(this.position.column / 3)
    return yBoxIdx * 3 + xBoxIdx;
  }

  state(): CellState {
    return {
      possibleNumbers: this.possibleNumbers,
      determined: this.fixedNum(),
      isInitial: this.isInitial,
    }
  }

  fixTo(n: Digit, isInitial?: boolean): boolean {
    if (this.possibleNumbers.size === 1) {
      return false
    }
    this.possibleNumbers.clear()
    this.possibleNumbers.add(n)
    if (isInitial !== undefined) {
      this.isInitial = isInitial
    }
    return true
  }

  fixedNum(): Digit | null {
    if (this.possibleNumbers.size !== 1) {
      return null
    }
    return Array.from(this.possibleNumbers.values())[0]
  }

  // it deletes the given number from possible list and returns this requires update
  deletePossibleNumber(n: Digit): boolean {
    if (!this.possibleNumbers.has(n)) {
      return false;
    }

    this.needUpdate = true;
    this.possibleNumbers.delete(n)
    return true;
  }

  markAsUpdated() {
    this.needUpdate = false
  }

  markAsUnupdated() {
    this.needUpdate = true
  }

  interacts(cell: CellData): boolean {
    if (this.position.row === cell.position.row && this.position.column === cell.position.column) { return false }
    if (this.position.row === cell.position.row) {
      return true
    }
    if (this.position.column === cell.position.column) {
      return true
    }
    return this.boxIdx() === cell.boxIdx()
  }

  valid(): boolean {
    return this.possibleNumbers.size > 0
  }
}
