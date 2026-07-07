import { useState } from 'react'
import Home from './pages/Home'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <section id="center">
       <Home/>
      </section>
    </>
  )
}

export default App
