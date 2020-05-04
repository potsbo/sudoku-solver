import React from 'react';
import './App.css';
import styled from 'styled-components'
import { Box } from './Box'
import { rank3Board } from './models/Board'

const BoxRow = styled.div`
  display: flex;
`

function App() {
  const board = rank3Board()

  while (board.updatable()) {
    board.update()
  }
  console.log("finished")

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
