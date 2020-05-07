import styled from 'styled-components';
import React from 'react';

const DivCell = styled.div`
  height: 50px;
  width: 50px;
  border: 1px solid black;
  color: gray;
  font-size: 105%;
  line-height: 100%;
`

const FixedNumCell = styled.div`
  height: 50px;
  width: 50px;
  border: 1px solid black;
  color: gray;
  vertical-align: middle;
  font-size: 300%;
  line-height: 100%;
`

interface CellProps {
    status: CellState
}

export const Cell = (props: CellProps) => {
    if (props.status.determined !== null) {
        const color = props.status.isInitial ? 'black' : 'blue'
        return (
            <FixedNumCell style={{ color }}>{props.status.determined}</FixedNumCell>
        )
    }
    return (
        <DivCell>{Array.from(props.status.possibleNumbers.keys()).join(" ")}</DivCell>
    )
}
