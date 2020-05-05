import React from 'react';
import './App.css';
import styled from 'styled-components'
import { Box } from './Box'
import { hardest } from './models/Board'
import { Solver } from './models/Solver'

const BoxRow = styled.div`
  display: flex;
`

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
