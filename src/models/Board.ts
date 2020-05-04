import { CellData } from './CellData'

interface Container {
  contains: (position: CellPosition) => boolean
}

interface Aggregator {
  aggregators: GroupCostructor[]
}

interface Group extends Container, Aggregator {
  // interaction: () => [[Group]]
  index: number
}

interface StatefulGroup extends Group {
  updated: boolean
}

type GroupCostructor = (position: CellPosition) => Group

class BoxData {
  updated = false
  index: number

  constructor(index: number) {
    this.index = index
  }

  contains(position: CellPosition): boolean {
    return positionToBoxIdx(position) === this.index;
  }

  aggregators: GroupCostructor[] = [
    Column.Find,
  ]

  static Find(position: CellPosition): Group {
    return new BoxData(positionToBoxIdx(position))
  }
}

class Row {
  updated = false
  index: number
  aggregators: GroupCostructor[] = [
    BoxData.Find
  ]

  constructor(index: number) {
    this.index = index
  }

  contains(position: CellPosition): boolean {
    return position.row === this.index
  }
}

class Column {
  updated = false
  index: number
  aggregators: GroupCostructor[] = [
    BoxData.Find
  ]

  constructor(index: number) {
    this.index = index
  }

  contains(position: CellPosition): boolean {
    return position.column === this.index
  }

  static Find(position: CellPosition): Group {
    return new Column(position.column)
  }
}

const positionToBoxIdx = (position: CellPosition): number => {
  const yBoxIdx = Math.floor(position.row / 3)
  const xBoxIdx = Math.floor(position.column / 3)
  return (yBoxIdx * 3 + xBoxIdx)
}
const Numbers = Array.from(Array(9).keys()).map(n => n + 1)

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

  private listCells(checker: Container): CellData[] {
    return this.cells.filter(c => checker.contains(c.position))
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

  updateGroup(group: StatefulGroup) {
    group.updated = true
    const cells = this.listCells(group)

    Numbers.forEach(n => {
      // fix a cell when there is only one possible cell for a number
      const candidateCells = cells.filter(c => c.possibleNumbers.has(n))
      if (candidateCells.length === 1) {
        this.fix(candidateCells[0].position, n);
      }

      // find a fixed column
      group.aggregators.forEach(aggregate => {
        const interactingGroups = candidateCells.map(c => aggregate(c.position))
        const interactingGroupSet = new Set(interactingGroups.map(g => g.index))

        if (interactingGroupSet.size === 1) {
          this.listCells(interactingGroups[0])
            .filter(c => !group.contains(c.position))
            .forEach(cell => {
              this.deletePossibleNumber(cell, n);
            })
        }
      })
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

    this.boxes.forEach(box => {
      this.updateGroup(box)
    })

    this.rows.forEach((row) => {
      this.updateGroup(row)
    })
    this.columns.forEach((column) => {
      this.updateGroup(column)
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

export const rank4Board = () => {
  const init = [
    [1, 0, 6, 0, 7, 0, 0, 0, 0],
    [0, 0, 0, 9, 0, 0, 0, 0, 3],
    [5, 0, 0, 0, 0, 0, 6, 4, 0],

    [0, 0, 1, 5, 0, 0, 0, 3, 0],
    [0, 0, 0, 4, 8, 0, 0, 0, 0],
    [0, 7, 3, 0, 0, 0, 0, 5, 0],

    [0, 0, 9, 0, 0, 0, 2, 0, 0],
    [0, 0, 0, 0, 0, 8, 7, 0, 0],
    [0, 0, 2, 0, 6, 0, 0, 1, 0],
  ]
  return new Board(init);
}

export const rank5Board = () => {
  const init = [
    [0, 6, 5, 0, 9, 0, 0, 8, 0],
    [0, 0, 0, 0, 0, 1, 4, 0, 7],
    [0, 7, 0, 6, 0, 0, 0, 0, 0],

    [0, 0, 0, 5, 0, 0, 7, 0, 4],
    [0, 0, 0, 3, 0, 0, 0, 0, 0],
    [3, 8, 7, 0, 0, 0, 0, 0, 0],

    [0, 0, 0, 0, 0, 2, 5, 0, 0],
    [2, 0, 0, 0, 0, 6, 0, 4, 0],
    [0, 0, 1, 0, 8, 0, 0, 0, 2],
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
