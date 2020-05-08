import { CellData } from './CellData'
import { CellPosition, Index, Digit, allIndices, allDigits, listInteractingPositions } from './CellPotision'

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
  updated = true
  index: Index

  constructor(index: Index) {
    this.index = index
  }

  contains(position: CellPosition): boolean {
    return position.boxIdx === this.index;
  }

  aggregators: GroupCostructor[] = [
    Column.Find,
    Row.Find,
  ]

  static Find(position: CellPosition): Group {
    return new BoxData(position.boxIdx)
  }
}

class Row {
  updated = true
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
  updated = true
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

export class Board {
  private cells: CellData[] = []
  private boxes: StatefulGroup[] = []
  private rows: StatefulGroup[] = []
  private columns: StatefulGroup[] = []

  constructor(initial?: number[][]) {
    const boardCells = getEmptyBoard()

    boardCells.forEach(row => {
      row.forEach(cell => {
        if (initial !== undefined) {
          const n = initial[cell.position.row][cell.position.column]
          if (n > 0 && n < 10) {
            cell.fixTo(n as Digit, true)
          }
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

  // attributes
  completed(): boolean {
    return this.cells.filter(c => c.fixedNum() === null).length === 0
  }

  valid(): boolean {
    return this.cells.filter(c => !c.valid()).length === 0
  }

  // getters
  getBoxCells(boxIndex: number): CellData[] {
    return this.cells.filter(c => c.position.boxIdx === boxIndex);
  }

  boxCells(): Map<Index, CellData[]> {
    const map = new Map<Index, CellData[]>()
    allIndices().forEach(i => {
      map.set(i, this.getBoxCells(i))
    })
    return map
  }

  listUnfixed(): { position: CellPosition, possibleNumbers: Set<Digit> }[] {
    const unfixed = this.cells.filter(c => c.fixedNum() === null)
    return unfixed.map(c => {
      return {
        position: c.position,
        possibleNumbers: c.possibleNumbers,
      }
    })
  }

  private listInteractingCellsTo(cell: CellData): CellData[] {
    return listInteractingPositions(cell.position).map(p => this.getCellAt(p))
  }

  private listCells(checker: Container): CellData[] {
    return this.cells.filter(c => checker.contains(c.position))
  }

  getCellAt(position: CellPosition): CellData {
    return this.cells[position.row * 9 + position.column]
  }

  // actions
  fix(position: CellPosition, n: Digit, asInitial?: boolean) {
    const cell = this.getCellAt(position)
    const updated = cell.fixTo(n, asInitial)
    if (updated) {
      this.publishUpdate(cell)
    }
  }

  private deletePossibleNumber(cell: CellData, n: Digit) {
    const updateRequired = cell.deletePossibleNumber(n)
    if (updateRequired) {
      this.publishUpdate(cell)
    }
  }

  deletePossibleNumberFromPosition(position: CellPosition, n: Digit) {
    const cell = this.getCellAt(position)
    const updateRequired = cell.deletePossibleNumber(n)
    if (updateRequired) {
      this.publishUpdate(cell)
    }
  }

  private updatePossibilities(cell: CellData) {
    if (cell.updated) { return }
    cell.updated = true
    const fixedNum = cell.fixedNum()
    if (fixedNum === null) {
      return
    }
    this.listInteractingCellsTo(cell).forEach(c => {
      this.deletePossibleNumber(c, fixedNum)
    })
  }

  private publishUpdate(cell: CellData) {
    this.boxes[cell.position.boxIdx].updated = false
    this.rows[cell.position.row].updated = false
    this.columns[cell.position.column].updated = false
    this.listInteractingCellsTo(cell).forEach(c => {
      c.updated = false
    })
  }

  private unupdatedCells() {
    return this.cells.filter(c => !c.updated)
  }

  private dump(): number[][] {
    const ret = allIndices().map(_ => allIndices().map(_ => 0))
    this.cells.forEach(cell => {
      const n = cell.fixedNum()
      if (!cell.isInitial || n === null) { return }
      ret[cell.position.row][cell.position.column] = n
    })
    return ret
  }

  copy(): Board {
    const init = this.dump()
    const copied = new Board(init)
    copied.load(this.cells)
    return copied
  }

  private load(cells: CellData[]) {
    cells.forEach(c => {
      this.getCellAt(c.position).possibleNumbers = new Set(c.possibleNumbers)
    })
  }

  private updateGroup(group: StatefulGroup) {
    if (group.updated) {
      return
    }
    group.updated = true
    const cells = this.listCells(group)

    allDigits().forEach(n => {
      // fix a cell when there is only one possible cell in a group
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

  private updatable(): boolean {
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

  update(callback?: (map: Map<Index, CellData[]>) => void) {
    while (this.updatable()) {
      if (callback !== undefined) { callback(this.boxCells()) }

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
      return new CellData(undefined, new CellPosition(rowIdx, columnIdx))
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

export const hardest = () => {
  // https://gizmodo.com/can-you-solve-the-10-hardest-logic-puzzles-ever-created-1064112665
  const init = [
    [8, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 3, 6, 0, 0, 0, 0, 0],
    [0, 7, 0, 0, 9, 0, 2, 0, 0],

    [0, 5, 0, 0, 0, 7, 0, 0, 0],
    [0, 0, 0, 0, 4, 5, 7, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 3, 0],

    [0, 0, 1, 0, 0, 0, 0, 6, 8],
    [0, 0, 8, 5, 0, 0, 0, 1, 0],
    [0, 9, 0, 0, 0, 0, 4, 0, 0],
  ]
  return new Board(init);
}

export const anotherHardest = () => {
  const init = [
    [0, 8, 0, 0, 0, 0, 1, 5, 0],
    [4, 0, 6, 5, 0, 9, 0, 8, 0],
    [0, 0, 0, 0, 0, 8, 0, 0, 0],

    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 2, 0, 4, 0, 0, 0, 3],
    [3, 0, 0, 8, 0, 1, 0, 0, 0],

    [9, 0, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 0, 0, 0, 0, 0, 4],
    [1, 5, 0, 0, 0, 0, 0, 9, 0],
  ]
  return new Board(init);
}

export const multipleSolutions = () => {
  const init = [
    [9, 2, 6, 5, 7, 1, 4, 8, 3],
    [3, 5, 1, 4, 8, 6, 2, 7, 9],
    [8, 7, 4, 9, 2, 3, 5, 1, 6],

    [5, 8, 2, 3, 6, 7, 1, 9, 4],
    [1, 4, 9, 2, 5, 8, 3, 6, 9],
    [7, 6, 3, 1, 0, 0, 8, 2, 5],

    [2, 3, 8, 7, 0, 0, 6, 5, 1],
    [6, 1, 7, 8, 3, 5, 9, 4, 2],
    [4, 9, 5, 6, 1, 2, 7, 3, 8],
  ]
  return new Board(init);
}
