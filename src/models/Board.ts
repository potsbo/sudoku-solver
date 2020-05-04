import { CellData } from './CellData'

class BoxData {
  updated = false
  index: number
  constructor(index: number) {
    this.index = index
  }
}

class Row {
  updated = false
  index: number

  constructor(index: number) {
    this.index = index
  }
}

class Column {
  updated = false
  index: number

  constructor(index: number) {
    this.index = index
  }
}

class Board {
  private cells: CellData[] = []
  private boxes: BoxData[] = []
  private rows: Row[] = []
  private columns: Column[] = []

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
    Array.from(Array(9).keys()).forEach((i) => {
      this.boxes.push(new BoxData(i))
      this.rows.push(new Row(i))
      this.columns.push(new Column(i))
    })
  }

  // getters
  deletePossibleNumber(cell: CellData, n: number) {
    const updateRequired = cell.deletePossibleNumber(n)
    if (updateRequired) {
      this.publishUpdate(cell)
    }
  }

  getBoxCells(boxIndex: number): CellData[] {
    return this.cells.filter(c => c.boxIdx() === boxIndex);
  }

  getColumnCells(column: number): CellData[] {
    return this.cells.filter(c => c.position.column === column)
  }

  getRowCells(row: number): CellData[] {
    return this.cells.filter(c => c.position.row === row)
  }

  listInteractingCellsTo(cell: CellData): CellData[] {
    // TODO: cache
    return this.cells.filter(c => cell.interacts(c))
  }

  // actions
  fix(position: CellPosition, n: number) {
    const cell = this.getCellAt(position)
    const updated = cell.fixTo(n)
    if (updated) {
      this.publishUpdate(cell)
    }
  }

  private getCellAt(position: CellPosition): CellData {
    return this.cells[position.row * 9 + position.column]
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

  private publishUpdate(cell: CellData) {
    this.boxes[cell.boxIdx()].updated = false
    this.rows[cell.position.row].updated = false
    this.columns[cell.position.column].updated = false
    this.listInteractingCellsTo(cell).forEach(c => {
      this.cells[c.position.row * 9 + c.position.column].needUpdate = true
    })
  }

  unupdatedCells() {
    return this.cells.filter(c => c.needUpdate)
  }

  updateBox(boxIndex: number) {
    this.boxes[boxIndex].updated = true
    const cells = this.getBoxCells(boxIndex)
    Array.from(Array(9).keys()).map(n => n + 1).forEach(num => {
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
        this.getColumnCells(Array.from(colSet.values())[0]).forEach(cell => {
          if (cell.boxIdx() === boxIndex) { return }
          this.deletePossibleNumber(cell, num);
        })
      }

      // find a fixed row
      const rowSet = new Set(marks.map(c => c.position.row))
      if (rowSet.size === 1) {
        this.getRowCells(Array.from(rowSet.values())[0]).forEach(cell => {
          if (cell.boxIdx() === boxIndex) { return }
          this.deletePossibleNumber(cell, num);
        })
      }
    })
  }

  updateRow(index: number) {
    this.rows[index].updated = true
    const row = this.rows[index]
    const cells = this.getRowCells(row.index)
    Array.from(Array(9).keys()).map(n => n + 1).forEach(n => {
      const boxIndices = cells
        .filter(c => c.possibleNumbers.has(n))
        .map(c => c.boxIdx())
      const boxSet = new Set(boxIndices)

      if (boxSet.size === 1) {
        this.getBoxCells(boxIndices[0]).filter(c => c.position.row !== index).forEach(c => {
          this.deletePossibleNumber(c, n)
        })
      }
    })
  }

  updateColumn(index: number) {
    this.columns[index].updated = true
    const column = this.columns[index]
    const cells = this.getColumnCells(column.index)
    Array.from(Array(9).keys()).map(n => n + 1).forEach(n => {
      const candidateCells = cells
        .filter(c => c.possibleNumbers.has(n))
      if (candidateCells.length === 1) {
        this.fix(candidateCells[0].position, n)
      }
      const boxIndices = candidateCells.map(c => c.boxIdx())

      const boxSet = new Set(boxIndices)

      if (boxSet.size === 1) {
        this.getBoxCells(boxIndices[0]).filter(c => c.position.column !== index).forEach(c => {
          this.deletePossibleNumber(c, n)
        })
      }
    })
  }

  updatable(): boolean {
    if (this.unupdatedCells().length > 0) {
      return true
    }
    if (this.boxes.filter(b => !b.updated).length > 0) {
      return true
    }
    if (this.rows.filter(b => !b.updated).length > 0) {
      return true
    }
    if (this.columns.filter(b => !b.updated).length > 0) {
      return true
    }
    return false
  }

  update() {
    this.unupdatedCells().forEach(cell => {
      this.updatePossibilities(cell)
    })

    this.boxes.forEach((_, index) => {
      this.updateBox(index)
    })

    this.rows.forEach((_, index) => {
      this.updateRow(index)
    })
    this.columns.forEach((_, index) => {
      this.updateColumn(index)
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
