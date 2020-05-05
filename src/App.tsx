import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import styled from 'styled-components'
import { Box } from './Box'
import { hardest } from './models/Board'
import { Solver } from './models/Solver'
import { Index } from './models/CellPotision'

const BoxRow = styled.div`
  display: flex;
`

const problem = hardest()

function App() {
  const [boxCells, setBoxCells] = useState(problem.boxCells())

  useEffect(() => {
    var start = new Date().getTime();
    const solver = new Solver(hardest(), true)

    const result = solver.solve()
    const end = new Date().getTime();
    const time = end - start;
    console.log('Execution time: ' + time);
    console.log("finished with", result)
    setBoxCells(solver.board.boxCells())
  }, [])



  const getBoxRow = (rowIdx: number) => {
    const getBox = (boxIdx: number) => {
      const cells = boxCells.get(boxIdx as Index) || [];
      return <Box cells={cells.map(s => s.state())} />
    }
    const offset = (rowIdx * 3) as Index
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
