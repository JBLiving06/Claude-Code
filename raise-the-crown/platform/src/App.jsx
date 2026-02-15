import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Workshop from './pages/Workshop'
import Resources from './pages/Resources'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="workshop" element={<Workshop />} />
        <Route path="workshop/:moduleId" element={<Workshop />} />
        <Route path="resources" element={<Resources />} />
      </Route>
    </Routes>
  )
}

export default App
