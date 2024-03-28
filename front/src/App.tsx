import { useEffect, useState } from 'react'
import './App.css'
import { Param } from './Param'

type ParamMeta = { name: string, shape: number[], type: string }

function App() {
  const [models, setModels] = useState<{ name: string, params: ParamMeta[] | null }[]>([])
  const [selectedModelName, setSelectedModelName] = useState<string | null>(null)
  const [selectedParamName, setSelectedParamName] = useState<string | null>(null)

  useEffect(() => {
    fetch('/models')
      .then((res) => res.json())
      .then((data) => setModels(data.map((name: string) => ({ name, params: null }))))
  }, [])

  useEffect(() => {
    if (!selectedModelName)
      return

    const model = models.find((model) => model.name === selectedModelName)
    if (!model || model.params !== null)
      return

    fetch(`/models/${selectedModelName}/params`)
      .then((res) => res.json())
      .then((data) => {
        setModels(models.map((model) => model.name === selectedModelName ? { name: model.name, params: data } : model))
      })
  }, [selectedModelName, models])

  const params = selectedModelName ? models.find((model) => model.name === selectedModelName)?.params ?? [] : []
  const selectedParam = params.find((param) => param.name === selectedParamName)

  return (
    <div className='App'>
      <div className='lists'>
        <h3>Models</h3>
        <div>
          {models.map((model, index) => (
            <div key={index} onClick={() => setSelectedModelName(model.name)}
              data-current={selectedModelName === model.name}>{model.name}</div>
          ))}</div>
        <hr />
        <h3>Params</h3>
        <div>
          {params.map((param, index) => (
            <div key={index} onClick={() => setSelectedParamName(param.name)}
              data-current={selectedParamName === param.name}>{param.name}</div>
          ))}
        </div>
      </div>
      {
        selectedModelName && selectedParam && (
          <div>
            <Param modelName={selectedModelName} meta={selectedParam} />
          </div>
        )
      }
    </div>
  )
}

export default App
