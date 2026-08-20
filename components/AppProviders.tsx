'use client';
import {ThemeProvider} from './ThemeProvider';import {WorkstationProvider} from './WorkstationProvider';
export default function AppProviders({children}:{children:React.ReactNode}){return <ThemeProvider><WorkstationProvider>{children}</WorkstationProvider></ThemeProvider>}
