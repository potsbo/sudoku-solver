import { CellData } from './CellData'

class Board {
  private cells: CellData[] = []
  private unupdatedBox: boolean[]

  constructor(initial: number[][]) {
    const boardCells = getEmptyBoard()
    boardCells.forEach(row => {
      row.forEach(cell => {
        const n = initial[cell.position.row][cell.position.column]
        if (n > 0) {
          cell.fixTo(n, true)
        }
        this.cells.push(cell)
      })
    })
    this.unupdatedBox = Array(9).fill(true)
  }

  fix(position: CellPosition, n: number) {
    const cell = this.getCellAt(position)
    const updated = cell.fixTo(n)
    if (updated) {
      this.unupdatedBox[cell.boxIdx()] = true
      this.listInteractingCellsTo(cell).forEach(c => {
        c.markAsUnupdated()
      })
    }
  }

  private getCellAt(position: CellPosition): CellData {
    return this.cells[position.row * 9 + position.column]
  }

  deletePossibleNumber(cell: CellData, n: number) {
    const updateRequired = cell.deletePossibleNumber(n)
    if (updateRequired) {
      this.unupdatedBox[cell.boxIdx()] = true
    }
  }

  getBoxCells(boxIndex: number): CellData[] {
    return this.cells.filter(c => c.boxIdx() === boxIndex);
  }

  getBoxColumnCells(column: number): CellData[] {
    return this.cells.filter(c => c.position.column === column)
  }

  getBoxRowCells(row: number): CellData[] {
    return this.cells.filter(c => c.position.row === row)
  }

  listInteractingCellsTo(cell: CellData): CellData[] {
    // TODO: cache
    return this.cells.filter(c => cell.interacts(c))
  }

  updatePossibilities(cell: CellData) {
    if (!cell.needUpdate) { return }
    cell.markAsUpdated()
    const fixedNum = cell.fixedNum()
    if (fixedNum === null) {
      return
    }
    this.listInteractingCellsTo(cell).forEach(c => {
      this.deletePossibleNumber(c, fixedNum)
    })
  }

  unupdatedCells() {
    return this.cells.filter(c => c.needUpdate)
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

export const rank3Board = () => {
  const init = [
    [0, 0, 0, 0, 8, 4, 0, 0, 0],
    [1, 6, 0, 0, 0, 3, 0, 0, 2],
    [0, 9, 0, 0, 0, 0, 0, 0, 4],

    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 2, 9, 3, 0, 0, 0, 7],
    [0, 4, 0, 0, 0, 0, 6, 5, 0],

    [8, 0, 0, 5, 0, 0, 0, 1, 0],
    [9, 0, 0, 6, 0, 7, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 6],
  ]
  return new Board(init);
}

export const difficult = () => {
  // https://cracking-the-cryptic.web.app/sudoku/497rhdJp27
  const init = [
    [0, 0, 4, 7, 0, 0, 0, 0, 3],
    [0, 3, 0, 0, 6, 0, 0, 9, 0],
    [9, 0, 0, 0, 0, 1, 8, 0, 0],

    [8, 0, 0, 0, 0, 2, 5, 0, 0],
    [0, 2, 0, 0, 7, 0, 0, 8, 0],
    [0, 0, 1, 4, 0, 0, 0, 0, 7],

    [0, 0, 9, 5, 0, 0, 0, 0, 1],
    [0, 5, 0, 0, 1, 0, 0, 3, 0],
    [2, 0, 0, 0, 0, 6, 7, 0, 0],
  ]
  return new Board(init);
}
