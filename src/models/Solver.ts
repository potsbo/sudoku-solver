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
  private readonly enableBruteForce: boolean
  private readonly allowedDepth: number
  private readonly delay: number
  private readonly maxSearch: number

  constructor(board: Board, bruteForce: boolean, maxDepth?: number, delay?: number) {
    this.allowedDepth = maxDepth || 5
    this.delay = delay || 0
    this.maxSearch = 10000
    this.board = board
    this.enableBruteForce = bruteForce
  }

  async solve(callback?: (map: Map<Index, CellData[]>) => void): Promise<Result> {
    await sleep(this.delay)
    cnt++
    if (cnt > this.maxSearch) {
      return { status: Status.Incompleted }
    }
    if (this.allowedDepth < 1) {
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

      const result = await this.update(callback)
      if (result.status === Status.Incompleted) { continue }
      return result
    }
  }

  private async update(callback?: (map: Map<Index, CellData[]>) => void): Promise<Result> {
    this.board.update()
    if (this.board.completed()) {
      return { status: Status.Completed, boxCells: this.board.boxCells() }
    }
    if (!this.board.valid()) {
      return { status: Status.Broken }
    }

    const cells = this.board.listUnfixed().sort((a, b) => (a.possibleNumbers.size > b.possibleNumbers.size) ? 1 : -1)
    for (const cell of cells) {
      let isDeadEnd = true  // TODO: check this is useful or not
      const digs = Array.from(cell.possibleNumbers.values())

      for (const dig of digs) {
        // try fixing a cell to check if it works
        const tmpBoard = this.board.copy()
        tmpBoard.fix(cell.position, dig, false)
        const solver = new Solver(tmpBoard, this.enableBruteForce, this.allowedDepth - 1)
        const result = await solver.solve(callback)

        switch (result.status) {
          case Status.Completed:
            return result
          case Status.Broken:
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
