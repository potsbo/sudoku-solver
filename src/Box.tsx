import React from 'react';
import styled from 'styled-components';
import { Cell } from './Cell'

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

export const Box = (props: BoxProps) => {
  return (
    <BoxDiv>
      <CellRow key={1}>
        <Cell status={props.cells[0]} />
        <Cell status={props.cells[1]} />
        <Cell status={props.cells[2]} />
      </CellRow>
      <CellRow key={2}>
        <Cell status={props.cells[3]} />
        <Cell status={props.cells[4]} />
        <Cell status={props.cells[5]} />
      </CellRow>
      <CellRow key={3}>
        <Cell status={props.cells[6]} />
        <Cell status={props.cells[7]} />
        <Cell status={props.cells[8]} />
      </CellRow>
    </BoxDiv>

  )
}
