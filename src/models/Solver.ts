import { Board } from './Board'
import { CellData } from './CellData'
import { Index } from './CellPotision'

type Result = {
  status: Status.Stuck | Status.Incompleted | Status.Broken
} | {
  status: Status.Completed
  boxCells: Map<Index, CellData[]>
}

export enum Status {
  Completed = "completed",
  Incompleted = "incompleted",
  Broken = "broken",
  Stuck = "stuck",
}

var cnt = 0
const sleep = (msec: number) => new Promise(resolve => setTimeout(resolve, msec));
export class Solver {
  public readonly board: Board
  private enableBruteForce: boolean
  private readonly maxDepth: number
  private readonly delay: number

  constructor(board: Board, bruteForce: boolean, maxDepth?: number, delay?: number) {
    this.maxDepth = maxDepth || 5
    this.delay = delay || 0
    this.board = board
    this.enableBruteForce = bruteForce
  }

  async solve(callback?: (map: Map<Index, CellData[]>) => void): Promise<Result> {
    await sleep(this.delay)
    cnt++
    if (cnt > 10000) {
      return { status: Status.Incompleted }
    }
    if (this.maxDepth < 1) {
      return { status: Status.Incompleted }
    }
    if (!this.enableBruteForce) {
      this.board.update()
      return { status: Status.Incompleted }
    }

    while (true) {
      if (callback !== undefined) {
        callback(this.board.boxCells())
      }
      if (this.board.completed()) {
        return { status: Status.Completed, boxCells: this.board.boxCells() }
      }

      const result = await this.update(callback)
      if (result.status === Status.Incompleted) { continue }
      return result
    }
  }

  private async update(callback?: (map: Map<Index, CellData[]>) => void): Promise<Result> {
    this.board.update()
    if (callback !== undefined) {
      callback(this.board.boxCells())
    }
    if (this.board.completed()) {
      return { status: Status.Completed, boxCells: this.board.boxCells() }
    }
    if (!this.board.valid()) {
      return { status: Status.Broken }
    }

    const cells = this.board.listUnfixed().sort((a, b) => (a.possibleNumbers.size > b.possibleNumbers.size) ? 1 : -1)
    for (const cell of cells) {
      let isDeadEnd = true
      const digs = Array.from(cell.possibleNumbers.values())

      for (const dig of digs) {
        const search = this.board.copy()
        search.fix(cell.position, dig, false)

        const solver = new Solver(search, this.enableBruteForce, this.maxDepth - 1)
        const result = await solver.solve(callback)

        if (result.status === Status.Completed) {
          return result
        }

        if (result.status === Status.Broken) {
          this.board.deletePossibleNumberFromPosition(cell.position, dig);
          return { status: Status.Incompleted }
        }

        isDeadEnd = false
      }
      if (isDeadEnd) {
        return { status: Status.Broken }
      }
    }

    return { status: Status.Stuck }
  }
}
