import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import TaskProvider from './context/TaskProvider.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <TaskProvider>
    <App />
  </TaskProvider>,
)
