import { Board } from './Board'

enum Status {
  Completed = "completed",
  Incompleted = "incompleted",
  Broken = "broken",
  Stuck = "stuck",
}

export class Solver {
  public readonly board: Board
  private enableBruteForce: boolean
  private readonly maxDepth: number

  constructor(board: Board, bruteForce: boolean, maxDepth?: number) {
    this.maxDepth = maxDepth || 5
    this.board = board
    this.enableBruteForce = bruteForce
  }

  solve(): Status {
    if (this.maxDepth < 1) {
      return Status.Incompleted
    }
    if (!this.enableBruteForce) {
      this.board.update()
      return Status.Incompleted
    }

    while (true) {
      if (this.board.completed()) {
        return Status.Completed
      }

      const result = this.update()
      if (result === Status.Incompleted) { continue }
      return result
    }
  }

  private update(): Status {
    this.board.update()
    if (!this.board.valid()) {
      return Status.Broken
    }
    if (this.board.completed()) {
      return Status.Completed
    }

    const cells = this.board.listUnfixed().sort((a, b) => (a.possibleNumbers.size > b.possibleNumbers.size) ? 1 : -1)
    for (const cell of cells) {
      let isDeadEnd = true
      const digs = Array.from(cell.possibleNumbers.values())

      for (const dig of digs) {
        const search = this.board.copy()
        search.fix(cell.position, dig)

        const solver = new Solver(search, this.enableBruteForce, this.maxDepth - 1)
        const result = solver.solve()

        if (result === Status.Broken) {
          this.board.deletePossibleNumberFromPosition(cell.position, dig);
          return Status.Incompleted
        }

        isDeadEnd = false
      }
      if (isDeadEnd) {
        return Status.Broken
      }
    }

    return Status.Stuck
  }
}
