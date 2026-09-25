import {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {Capacitor} from '@capacitor/core';
import {App} from '@capacitor/app';
import {Browser} from '@capacitor/browser';
import {StatusBar,Style} from '@capacitor/status-bar';
import {supabase} from '../lib/supabase';
import {API_BASE_URL} from '../lib/config';
import {Feedback} from './ui';

export function NativeSupport(){
 const navigate=useNavigate();
 useEffect(()=>{
  if(!Capacitor.isNativePlatform())return;
  void StatusBar.setStyle({style:Style.Dark}).catch(()=>{});
  const back=App.addListener('backButton',()=>{
   const close=document.querySelector<HTMLButtonElement>('[role="dialog"] .dialog-close');
   if(close){close.click();return;}
   if((window.history.state?.idx??0)>0)navigate(-1);else void App.minimizeApp();
  });
  async function handleUrl(value:string){
   const url=new URL(value);
   if(url.protocol!=='com.urjaai.app:'||url.hostname!=='auth'||!['/dashboard','/reset-password'].includes(url.pathname))return;
   const hash=new URLSearchParams(url.hash.slice(1));
   const access=hash.get('access_token'),refresh=hash.get('refresh_token');
   if(access&&refresh&&supabase){const result=await supabase.auth.setSession({access_token:access,refresh_token:refresh});if(result.error)return;}
   navigate(url.pathname,{replace:true});
  }
  const urls=App.addListener('appUrlOpen',event=>{void handleUrl(event.url).catch(()=>{});});
  void App.getLaunchUrl().then(value=>{if(value)void handleUrl(value.url).catch(()=>{});});
  const external=(event:MouseEvent)=>{
   const anchor=(event.target as Element).closest?.('a[href]');if(!anchor)return;
   const href=anchor.getAttribute('href')!;
   const url=new URL(href,location.href);
   if(url.origin===location.origin||url.protocol==='blob:')return;
   event.preventDefault();
   if(url.protocol==='https:')void Browser.open({url:url.href});
  };
  document.addEventListener('click',external);
  return ()=>{void back.then(h=>h.remove());void urls.then(h=>h.remove());document.removeEventListener('click',external);};
 },[navigate]);
 if(!Capacitor.isNativePlatform()||(API_BASE_URL&&supabase))return null;
 return <Feedback kind="info" title="Backend setup required">This APK contains the UrjaAI interface, but a public HTTPS backend and Supabase public configuration have not been supplied. Sign-in and live data are unavailable until it is rebuilt with those settings.</Feedback>;
}
