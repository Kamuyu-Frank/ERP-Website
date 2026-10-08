import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Outlet, createRootRouteWithContext, useRouter, HeadContent, Scripts } from '@tanstack/react-router';
import { useEffect, type ReactNode } from 'react';
import appCss from '../styles.css?url';
import { reportHiggsfieldError } from '../lib/higgsfield-error-reporting';
import meta from '../app-meta.json';
import {scrollScrubTheme} from '../scroll-scrub-scenes';
declare const __HF_DESIGN_INSPECTOR__:boolean;
const site='https://snaperp-journey.higgsfield.app';
export const Route=createRootRouteWithContext<{queryClient:QueryClient}>()({
 head:({matches})=>({meta:[{charSet:'utf-8'},{name:'viewport',content:'width=device-width, initial-scale=1'},{title:meta.og_title||'SnapERP'},{name:'description',content:meta.og_description||'Sales, stock and accounts, connected.'},{name:'theme-color',content:scrollScrubTheme.background},{name:'robots',content:'noindex, nofollow'},{property:'og:title',content:meta.og_title||'SnapERP'},{property:'og:description',content:meta.og_description||''},{property:'og:type',content:'website'},{property:'og:url',content:site+(matches.at(-1)?.pathname||'/')},{property:'og:image',content:meta.og_image_url||''},{name:'twitter:card',content:'summary_large_image'},{name:'twitter:image',content:meta.og_image_url||''}],links:[{rel:'stylesheet',href:appCss},{rel:'icon',href:'/favicon.ico'},{rel:'icon',type:'image/png',sizes:'16x16',href:'/assets/favicon-16.png'},{rel:'icon',type:'image/png',sizes:'32x32',href:'/assets/favicon-32.png'},{rel:'apple-touch-icon',href:'/assets/favicon-180.png'},{rel:'manifest',href:'/site.webmanifest'},{rel:'canonical',href:site+(matches.at(-1)?.pathname||'/')}]}),shellComponent:RootShell,component:RootComponent,notFoundComponent:NotFound,errorComponent:ErrorPage
});
function NotFound(){return <main className="error-page"><h1>Page not found.</h1><p>Return to SnapERP to explore the business workflow.</p><a href="/">Return to SnapERP ↗</a></main>}
function ErrorPage({error,reset}:{error:Error;reset:()=>void}){const router=useRouter();useEffect(()=>{reportHiggsfieldError(error,{boundary:'tanstack_root_error_component'});},[error]);return <main className="error-page"><h1>This page could not load.</h1><p>Please try again.</p><button onClick={()=>{router.invalidate();reset();}}>Try again</button><a href="/">Return to SnapERP ↗</a></main>}
function RootShell({children}:{children:ReactNode}){return <html lang="en" suppressHydrationWarning><head><script src="/theme.js"/><HeadContent/></head><body>{children}<Scripts/></body></html>}
function RootComponent(){const {queryClient}=Route.useRouteContext();useEffect(()=>{if(!__HF_DESIGN_INSPECTOR__)return;void import('../module/design-inspector/runtime').then(({installHiggsfieldDesignInspector})=>installHiggsfieldDesignInspector()).catch(error=>reportHiggsfieldError(error instanceof Error?error:new Error('Design inspector unavailable'),{boundary:'higgsfield_design_inspector_import'}));},[]);return <QueryClientProvider client={queryClient}><Outlet/></QueryClientProvider>}
