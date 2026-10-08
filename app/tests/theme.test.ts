import {expect,test} from 'bun:test';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../public/theme.js',import.meta.url),'utf8');
function setup(dark=false,saved:string|null=null,blocked=false){
 const events=new EventTarget();
 const dataset:Record<string,string>={};
 const messages:unknown[]=[];
 let deviceChanged=()=>{};
 const device={matches:dark,addEventListener:(_name:string,fn:()=>void)=>{deviceChanged=fn;}};
 const frame={postMessage:(message:unknown)=>messages.push(message)};
 const win=Object.assign(events,{matchMedia:()=>device,parent:events});
 const storage={getItem:()=>{if(blocked)throw Error('blocked');return saved;},setItem:(_key:string,value:string)=>{if(blocked)throw Error('blocked');saved=value;}};
 runInNewContext(source,{window:win,document:{documentElement:{dataset},querySelectorAll:()=>[{contentWindow:frame}]},localStorage:storage,location:{origin:'https://example.test'},Event});
 return {dataset,messages,select:(value:string)=>events.dispatchEvent(new CustomEvent('snaperp-theme-select',{detail:value})),device:(value:boolean)=>{device.matches=value;deviceChanged();},storage:(value:string|null)=>{const e=new Event('storage');Object.assign(e,{key:'snaperp-theme',newValue:value});events.dispatchEvent(e);},saved:()=>saved};
}
test('device theme follows live operating system changes',()=>{const t=setup();expect(t.dataset.theme).toBe('light');t.device(true);expect(t.dataset.theme).toBe('dark');expect(t.dataset.themePreference).toBe('system');});
test('manual override persists, ignores device changes and can return to system',()=>{const t=setup(true);t.select('light');t.device(true);expect(t.dataset.theme).toBe('light');expect(t.saved()).toBe('light');t.select('system');expect(t.dataset.theme).toBe('dark');expect(t.messages.at(-1)).toEqual({type:'snaperp-theme',preference:'system'});});
test('restores saved choice and synchronizes other tabs and clearing storage',()=>{const t=setup(false,'dark');expect(t.dataset.theme).toBe('dark');t.storage('light');expect(t.dataset.theme).toBe('light');t.storage(null);expect(t.dataset.themePreference).toBe('system');});
test('invalid choices and unavailable storage are safe',()=>{const t=setup(true,'bogus',true);expect(t.dataset.theme).toBe('dark');t.select('invalid');expect(t.dataset.themePreference).toBe('system');t.select('light');expect(t.dataset.theme).toBe('light');});
