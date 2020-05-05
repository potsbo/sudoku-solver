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
}

class Solver {
  public readonly board: Board
  private enableBruteForce: boolean
  private readonly maxDepth: number

  constructor(board: Board, bruteForce: boolean, maxDepth?: number) {
    this.maxDepth = maxDepth || 3
    this.board = board
    this.enableBruteForce = bruteForce
  }

  solve(): Status {
    if (!this.enableBruteForce) {
      this.board.update()
      return Status.Incompleted
    }
    var depth = 0

    while (true) {
      if (this.board.completed()) {
        return Status.Completed
      }
      depth++
      if (depth > this.maxDepth) { return Status.Incompleted }
      console.log("not completed")

      this.board.update()

      const cells = this.board.pickUnfixedCell()
      for (let i = 0; i < cells.length; i++) {
        let isDeadEnd = true
        const cell = cells[i]
        const digs = Array.from(cell.possibleNumbers.values())

        digs.forEach(dig => {
          const init = this.board.dump()
          init[cell.position.row][cell.position.column] = dig
          const search = new Board(init)

          if (!search.valid()) {
            this.board.deletePossibleNumberFromPosition(cell.position, dig);
          } else {
            isDeadEnd = false
          }
        })
        if (isDeadEnd) {
          return Status.Broken
        }
      }
    }
  }
}

function App() {
  const solver = new Solver(hardest(), true)
  const result = solver.solve()
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
