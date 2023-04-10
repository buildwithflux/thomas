import { createContext } from 'react'

import { ISDFTextServices } from './types'

export const SDFTextProviderContext = createContext<ISDFTextServices | null>(null)
