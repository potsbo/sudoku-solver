import styled from 'styled-components';
import React from 'react';

const DivCell = styled.div`
  height: 50px;
  width: 50px;
  border: 1px solid black;
  color: gray;
`

interface CellProps {
    status: CellState
}

export const Cell = (props: CellProps) => {
    if (props.status.determined !== null) {
        const color = props.status.isInitial ? 'black' : 'blue'
        return (
            <DivCell style={{ color }}>{props.status.determined}</DivCell>
        )
    }
    return (
        <DivCell>{Array.from(props.status.possibleNumbers.keys()).join(" ")}</DivCell>
    )
}
