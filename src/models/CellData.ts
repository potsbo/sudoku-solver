import { CellPosition, Interaction } from './CellPotision'
import { Digit, allDigits, sameBox, sameColumn, sameRow } from './CellPotision'

export class CellData {
  needUpdate: boolean
  possibleNumbers: Set<Digit>
  position: CellPosition
  isInitial: boolean
  private interactions: Interaction[]

  constructor(n: Digit | undefined, position: CellPosition) {
    this.interactions = [sameRow, sameColumn, sameBox]
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

  public state(): CellState {
    return {
      possibleNumbers: this.possibleNumbers,
      determined: this.fixedNum(),
      isInitial: this.isInitial,
    }
  }

  public fixTo(n: Digit, isInitial?: boolean): boolean {
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

  public fixedNum(): Digit | null {
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

  interacts(cell: CellData): boolean {
    if (this.position.row === cell.position.row && this.position.column === cell.position.column) { return false }
    return this.interactions
      .map(f => f(this.position, cell.position))
      .reduce((a, b) => a || b)
  }

  valid(): boolean {
    return this.possibleNumbers.size > 0
  }
}
