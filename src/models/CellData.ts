import { CellPosition } from './CellPotision'
import { Digit, allDigits } from './CellPotision'

export class CellData {
  needUpdate: boolean
  possibleNumbers: Set<Digit>
  public readonly position: CellPosition
  private isInitial: boolean

  constructor(n: Digit | undefined, position: CellPosition) {
    this.needUpdate = false;
    this.possibleNumbers = new Set(allDigits())
    this.position = position
    this.isInitial = false
    if (n !== undefined && n > 0) {
      this.fixTo(n)
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

  valid(): boolean {
    return this.possibleNumbers.size > 0
  }
}
