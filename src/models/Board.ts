import { CellData } from './CellData'
import { CellPosition, Index, allIndices, allDigits } from './CellPotision'

interface Container {
  contains: (position: CellPosition) => boolean
}

interface Aggregator {
  readonly aggregators: GroupCostructor[]
}

interface Group extends Container, Aggregator {
  readonly index: Index
}

interface StatefulGroup extends Group {
  updated: boolean
}

type GroupCostructor = (position: CellPosition) => Group

class BoxData {
  updated = false
  index: Index

  constructor(index: Index) {
    this.index = index
  }

  contains(position: CellPosition): boolean {
    return position.boxIdx() === this.index;
  }

  aggregators: GroupCostructor[] = [
    Column.Find,
    Row.Find,
  ]

  static Find(position: CellPosition): Group {
    return new BoxData(position.boxIdx())
  }
}

class Row {
  updated = false
  index: Index
  aggregators: GroupCostructor[] = [
    BoxData.Find
  ]

  constructor(index: Index) {
    this.index = index
  }

  contains(position: CellPosition): boolean {
    return position.row === this.index
  }

  static Find(position: CellPosition): Group {
    return new Row(position.row)
  }
}

class Column {
  updated = false
  index: Index
  aggregators: GroupCostructor[] = [
    BoxData.Find
  ]

  constructor(index: Index) {
    this.index = index
  }

  contains(position: CellPosition): boolean {
    return position.column === this.index
  }

  static Find(position: CellPosition): Group {
    return new Column(position.column)
  }
}

class Board {
  private cells: CellData[] = []
  private boxes: StatefulGroup[] = []
  private rows: StatefulGroup[] = []
  private columns: StatefulGroup[] = []

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
    allIndices().forEach((i) => {
      this.boxes.push(new BoxData(i))
      this.rows.push(new Row(i))
      this.columns.push(new Column(i))
    })
  }

  // getters
  getBoxCells(boxIndex: number): CellData[] {
    return this.cells.filter(c => c.boxIdx() === boxIndex);
  }

  dump(): number[][] {
    const ret = Array(9).fill(Array(9).fill(0))
    this.cells.forEach(cell => {
      const n = cell.fixedNum()
      if (n === null) { return }
      ret[cell.position.row][cell.position.column] = n
    })
    return ret
  }

  completed(): boolean {
    return this.cells.filter(c => c.fixedNum() === null).length === 0
  }

  private listInteractingCellsTo(cell: CellData): CellData[] {
    // TODO: cache
    return this.cells.filter(c => cell.interacts(c))
  }

  private listCells(checker: Container): CellData[] {
    return this.cells.filter(c => checker.contains(c.position))
  }

  private getCellAt(position: CellPosition): CellData {
    return this.cells[position.row * 9 + position.column]
  }


  // actions
  private fix(position: CellPosition, n: number) {
    const cell = this.getCellAt(position)
    const updated = cell.fixTo(n)
    if (updated) {
      this.publishUpdate(cell)
    }
  }

  private deletePossibleNumber(cell: CellData, n: number) {
    const updateRequired = cell.deletePossibleNumber(n)
    if (updateRequired) {
      this.publishUpdate(cell)
    }
  }

  private updatePossibilities(cell: CellData) {
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
      c.needUpdate = true
    })
  }

  private unupdatedCells() {
    return this.cells.filter(c => c.needUpdate)
  }

  updateGroup(group: StatefulGroup) {
    group.updated = true
    const cells = this.listCells(group)

    allDigits().forEach(n => {
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
    while (this.updatable()) {
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
}


const getEmptyBoard = (): CellData[][] => {
  return allIndices().map(rowIdx => {
    return allIndices().map((columnIdx) => {
      return new CellData(0, new CellPosition(rowIdx, columnIdx))
    })
  })
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
