import React, { useState, useEffect } from 'react';
import './App.css';
import styled from 'styled-components'
import { Box } from './Box'
import { hardest } from './models/Board'
import { Solver, Status } from './models/Solver'
import { Index } from './models/CellPotision'

const BoxRow = styled.div`
  display: flex;
`

const problem = hardest()

function App() {
  const [boxCells, setBoxCells] = useState(problem.boxCells())

  useEffect(() => {
    var start = new Date().getTime();
    const solver = new Solver(problem, true)

    solver.solve((boxCells) => {
      setBoxCells(boxCells)
    }).then((result) => {
      const end = new Date().getTime();
      const time = end - start;
      console.log('Execution time: ' + time);
      console.log("finished with", result)
      if (result.status === Status.Completed) {
        setBoxCells(result.boxCells)
      }
    })
  }, [])


  const getBoxRow = (rowIdx: number) => {
    const getBox = (boxIdx: number) => {
      const cells = boxCells.get(boxIdx as Index) || [];
      return <Box key={boxIdx} cells={cells.map(s => s.state())} />
    }
    const offset = (rowIdx * 3) as Index
    return (
      <BoxRow key={rowIdx}>
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
