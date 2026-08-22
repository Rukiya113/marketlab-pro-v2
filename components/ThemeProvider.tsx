'use client';
import {createContext,useContext,useEffect,useMemo,useState,type ReactNode} from 'react';
export type MarketLabTheme='light'|'professional'|'soft'|'dark';
const THEMES:MarketLabTheme[]=['light','professional','soft','dark'];
type ThemeContextValue={theme:MarketLabTheme;setTheme:(theme:MarketLabTheme)=>void};
const ThemeContext=createContext<ThemeContextValue|null>(null);
export function ThemeProvider({children}:{children:ReactNode}){const[theme,setThemeState]=useState<MarketLabTheme>('dark');useEffect(()=>{const saved=window.localStorage.getItem('marketlab-theme') as MarketLabTheme|null;if(saved&&THEMES.includes(saved))setThemeState(saved)},[]);useEffect(()=>{document.documentElement.dataset.theme=theme;window.localStorage.setItem('marketlab-theme',theme)},[theme]);const value=useMemo(()=>({theme,setTheme:setThemeState}),[theme]);return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>}
export function useTheme(){const value=useContext(ThemeContext);if(!value)throw new Error('useTheme must be used inside ThemeProvider');return value}
export const THEME_OPTIONS:[MarketLabTheme,string,string][]=[['light','MarketLab Light','Bright white workspace with market green accents'],['professional','Professional','Cool slate surfaces with blue-green accents'],['soft','Soft Contrast','Warm low-glare surfaces for long sessions'],['dark','Terminal Dark','Original dark terminal appearance']];
