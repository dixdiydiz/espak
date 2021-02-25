import React from 'react'
import ReactDOM from 'react-dom'
import test, { aaa } from './test'
import App from '@src/App'
import './index.css'
console.log(test, aaa)
ReactDOM.render(
  <React.StrictMode>
    ;<App />
  </React.StrictMode>,
  document.getElementById('root')
)

console.log(React, ReactDOM)
console.log(test, aaa)
if (import.meta) {
  console.log(import.meta)
}
