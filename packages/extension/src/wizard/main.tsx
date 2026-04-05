import { createRoot } from 'react-dom/client'
import '../index.css'
import { Wizard } from '@/features/wizard/components/Wizard'

const root = document.getElementById('root')!
createRoot(root).render(<Wizard />)