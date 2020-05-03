import React from 'react';
import './App.css';
import styled from 'styled-components'

const DivCell = styled.div`
  height: 50px;
  width: 50px;
  border: 1px solid black;
  color: gray;
`

interface CellState {
  isInitial: boolean
  determined: number | null
  possibleNumbers: Set<number>
}

interface CellProps {
  status: CellState
}

const Cell = (props: CellProps) => {
  if (props.status.determined !== null) {
    const color = props.status.isInitial ? 'black' : 'blue'
    return (
      <DivCell style={{ color }}>{props.status.determined}</DivCell>
    )
  }
  return (
    <DivCell>{Array.from(props.status.possibleNumbers.keys()).join(" ")}</DivCell>
  )
}

const CellRow = styled.div`
  display: flex;
`

const BoxDiv = styled.div`
  border: 1px solid black;
  width: 150px;
`

interface BoxProps {
  cells: Array<CellState>
}

const Box = (props: BoxProps) => {
  return (
    <BoxDiv>
      <CellRow>
        <Cell status={props.cells[0]} />
        <Cell status={props.cells[1]} />
        <Cell status={props.cells[2]} />
      </CellRow>
      <CellRow>
        <Cell status={props.cells[3]} />
        <Cell status={props.cells[4]} />
        <Cell status={props.cells[5]} />
      </CellRow>
      <CellRow>
        <Cell status={props.cells[6]} />
        <Cell status={props.cells[7]} />
        <Cell status={props.cells[8]} />
      </CellRow>
    </BoxDiv>

  )
}

const BoxRow = styled.div`
  display: flex;
`

interface Position {
  row: number
  column: number
}

class CellData {
  needUpdate: boolean
  possibleNumbers: Set<number>
  position: Position
  isInitial: boolean

  constructor(n: number | undefined, position: Position) {
    this.needUpdate = true;
    this.possibleNumbers = new Set()
    this.position = position
    this.isInitial = false
    if (n !== undefined && n > 0) {
      this.possibleNumbers.add(n);
    } else {
      [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach((n) => {
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

  fixTo(n: number, isInitial?: boolean): boolean {
    if (this.possibleNumbers.size === 1) {
      return false
    }
    if (this.position.row === 5 && this.position.column === 7) {
      console.log("update ", n)
    }
    this.possibleNumbers.clear()
    this.possibleNumbers.add(n)
    if (isInitial !== undefined) {
      this.isInitial = isInitial
    }
    return true
  }

  fixedNum(): number | null {
    if (this.possibleNumbers.size !== 1) {
      return null
    }
    return Array.from(this.possibleNumbers.values())[0]
  }

  // it deletes the given number from possible list and returns this requires update
  deletePossibleNumber(n: number): boolean {
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
}

class Board {
  cells: CellData[][]
  unupdatedBox: boolean[]
  constructor(initial: number[][]) {
    this.cells = getEmptyBoard()
    this.cells.forEach(row => {
      row.forEach(cell => {
        const n = initial[cell.position.row][cell.position.column]
        if (n > 0) {
          cell.fixTo(n, true)
        }
      })
    })
    this.unupdatedBox = Array(9).fill(true)
  }

  fix(position: Position, n: number) {
    const cell = this.cells[position.row][position.column];
    const updated = cell.fixTo(n)
    if (updated) {
      this.unupdatedBox[cell.boxIdx()] = true
      this.listInteractingCellsTo(cell).forEach(c => {
        c.markAsUnupdated()
      })
    }
  }

  deletePossibleNumber(cell: CellData, n: number) {
    const updateRequired = cell.deletePossibleNumber(n)
    if (updateRequired) {
      this.unupdatedBox[cell.boxIdx()] = true
    }
  }

  // TODO: refactor
  getFlatCells(): CellData[] {
    const founds: CellData[] = []
    this.cells.forEach(row => {
      row.forEach(interactingCell => {
        founds.push(interactingCell)
      })
    })
    return founds;
  }

  getBoxCells(boxIndex: number): CellData[] {
    return this.getFlatCells().filter(c => c.boxIdx() === boxIndex);
  }

  getBoxColumnCells(column: number): CellData[] {
    return this.getFlatCells().filter(c => c.position.column === column)
  }

  getBoxRowCells(row: number): CellData[] {
    return this.getFlatCells().filter(c => c.position.row === row)
  }

  listInteractingCellsTo(cell: CellData): CellData[] {
    // TODO: cache
    const founds: CellData[] = []
    this.cells.forEach(row => {
      row.forEach(interactingCell => {
        if (cell.interacts(interactingCell)) {
          founds.push(interactingCell)
        }
      })
    })
    return founds;
  }

  updatePossibilities(cell: CellData) {
    if (!cell.needUpdate) { return }
    cell.markAsUpdated()
    const fixedNum = cell.fixedNum()
    if (fixedNum === null) {
      return
    }
    this.cells.forEach(row => {
      row.forEach(interactingCell => {
        if (!cell.interacts(interactingCell)) {
          return;
        }
        this.deletePossibleNumber(interactingCell, fixedNum);
      })
    })
  }

  unupdatedCells() {
    const ret: CellData[] = []
    this.cells.forEach(row => {
      row.forEach(cell => {
        if (cell.needUpdate) {
          ret.push(cell)
        }
      })
    })

    return ret
  }

  updateBox(boxIndex: number) {
    this.unupdatedBox[boxIndex] = false
    const cells = this.getBoxCells(boxIndex)
    Array.from(Array(9).keys()).forEach(num => {
      num++
      const marks: CellData[] = []

      // fix a cell when there is only one possible cell for a number
      cells.forEach(cell => {
        if (cell.possibleNumbers.has(num)) {
          marks.push(cell)
        }
      });
      if (marks.length === 1) {
        this.fix(marks[0].position, num);
      }

      // find a fixed column
      const colSet = new Set(marks.map(c => c.position.column))
      if (colSet.size === 1) {
        this.getBoxColumnCells(Array.from(colSet.values())[0]).forEach(cell => {
          if (cell.boxIdx() === boxIndex) { return }
          this.deletePossibleNumber(cell, num);
        })
      }

      // find a fixed row
      const rowSet = new Set(marks.map(c => c.position.row))
      if (rowSet.size === 1) {
        this.getBoxRowCells(Array.from(rowSet.values())[0]).forEach(cell => {
          if (cell.boxIdx() === boxIndex) { return }
          this.deletePossibleNumber(cell, num);
        })
      }
    })
  }

  updatable(): boolean {
    return this.unupdatedCells().length > 0 || this.unupdatedBox.filter(s => s).length > 0
  }

  update() {
    this.unupdatedCells().forEach(cell => {
      this.updatePossibilities(cell)
    })

    this.unupdatedBox.forEach((_, index) => {
      this.updateBox(index)
    })
  }
}

const getEmptyBoard = (): CellData[][] => {
  const data: CellData[][] = []
  for (let rowIdx = 0; rowIdx < 9; rowIdx++) {
    const row: CellData[] = []
    for (let columnIdx = 0; columnIdx < 9; columnIdx++) {
      row.push(new CellData(0, { row: rowIdx, column: columnIdx }))
    }
    data.push(row)
  }
  return data
}

function App() {
  const init = [
    [0, 0, 1, 0, 2, 4, 0, 0, 0],
    [0, 0, 0, 5, 7, 0, 0, 6, 0],
    [0, 6, 0, 0, 0, 0, 0, 2, 0],

    [0, 2, 5, 0, 0, 0, 3, 9, 0],
    [7, 0, 0, 0, 0, 6, 0, 0, 0],
    [0, 0, 0, 4, 0, 0, 5, 0, 2],

    [2, 0, 0, 0, 0, 0, 0, 0, 4],
    [0, 0, 0, 0, 0, 0, 6, 0, 0],
    [0, 0, 6, 0, 8, 3, 0, 0, 5],
  ]
  const board = new Board(init);

  while (board.updatable()) {
    board.update()
  }

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
