import { useEffect, useState } from 'react'
import './App.css'
import { Param } from './Param'

type ParamMeta = { name: string, shape: number[], type: string }

function App() {
  const [params, setParams] = useState<ParamMeta[]>([])
  const [selectedParam, setSelectedParam] = useState<ParamMeta | null>(null)

  useEffect(() => {
    fetch('/params')
      .then((res) => res.json())
      .then((data) => setParams(data))
  }, [])

  return (
    <div className='App'>
      <div className='list'>
        {params.map((param, index) => (
          <div key={index} onClick={() => setSelectedParam(param)}>{param.name}</div>
        ))}
      </div>
      {
        selectedParam && (
          <div>
            <Param meta={selectedParam} />
          </div>
        )
      }
    </div>
  )
}

export default App
