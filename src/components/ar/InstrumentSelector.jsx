import React from 'react'
import { AR_INSTRUMENTS } from '../../data/instruments'

export default function InstrumentSelector({ id, value, onChange }) {
  return <div className="ar-instrument-selector">
    <label htmlFor={id}>Selecciona un instrumento</label>
    <select id={id} value={value} onChange={event => onChange(event.target.value)}>
      {AR_INSTRUMENTS.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
    </select>
  </div>
}
