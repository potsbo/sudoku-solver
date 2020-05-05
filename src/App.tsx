import React from 'react';
import './App.css';
import styled from 'styled-components'
import { Box } from './Box'
import { hardest, Board } from './models/Board'

const BoxRow = styled.div`
  display: flex;
`

enum Status {
  Completed = "completed",
  Incompleted = "incompleted",
  Broken = "broken",
  Stuck = "stuck",
}

class Solver {
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
      if (result === Status.Broken) {
        return result
      }
      if (result === Status.Stuck) {
        return result
      }
      if (result === Status.Completed) {
        return result
      }
    }
  }

  private update(): Status {
    this.board.update()
    if (this.board.completed()) {
      return Status.Completed
    }
    if (!this.board.valid()) {
      return Status.Broken
    }

    const cells = this.board.listUnfixed().sort((a, b) => (a.possibleNumbers.size > b.possibleNumbers.size) ? 1 : -1)
    for (let i = 0; i < cells.length; i++) {
      let isDeadEnd = true
      const cell = cells[i]
      const digs = Array.from(cell.possibleNumbers.values())

      for (let j = 0; j < digs.length; j++) {
        const dig = digs[j]
        const search = this.board.copy()
        search.fix(cell.position, dig)

        const solver = new Solver(search, this.enableBruteForce, this.maxDepth - 1)
        const result = solver.solve()

        if (result === Status.Broken) {
          this.board.deletePossibleNumberFromPosition(cell.position, dig);
          return Status.Incompleted
        } else {
          isDeadEnd = false
        }
      }
      if (isDeadEnd) {
        return Status.Broken
      }
    }

    return Status.Stuck
  }
}

function App() {
  const solver = new Solver(hardest(), true)
  var start = new Date().getTime();

  const result = solver.solve()
  const end = new Date().getTime();
  const time = end - start;
  console.log('Execution time: ' + time);
  console.log("finished with", result)
  const board = solver.board

  const getBoxRow = (rowIdx: number) => {
    const getBox = (boxIdx: number) => {
      return <Box cells={board.getBoxCells(boxIdx).map(s => s.state())} />
    }
    const offset = rowIdx * 3
    return (
      <BoxRow>
        {getBox(offset + 0)}
        {getBox(offset + 1)}
        {getBox(offset + 2)}
      </BoxRow>
    )
  }

  return (
    <div className="App">
      <div>
        {getBoxRow(0)}
        {getBoxRow(1)}
        {getBoxRow(2)}
      </div>
    </div >
  );
}

export default App;
