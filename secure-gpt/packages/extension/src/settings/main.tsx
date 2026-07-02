import { createRoot } from 'react-dom/client'
import '../index.css'
import { Settings } from '@/features/settings/components/Settings'

const root = document.getElementById('root')!
createRoot(root).render(<Settings />)