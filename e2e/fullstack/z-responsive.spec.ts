import {test,expect,type Page} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
async function fits(page:Page,label:string){
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),{message:label}).toBeLessThanOrEqual(1);
}
test('all page families, tabs, charts and navigation at phone/tablet/desktop sizes',async({page})=>{
 test.setTimeout(300000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/login');await page.getByLabel('Work email').fill('owner@urjaai.test');await page.getByLabel('Password',{exact:true}).fill('Test-only-password-123');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/dashboard/);
 await page.goto('/machines');const machine=await page.getByRole('link',{name:'TEST ONLY VMC integration',exact:true}).getAttribute('href');
 await page.goto('/share');const listing=await page.locator('a[href^="/share/"]').first().getAttribute('href');
 await mkdir('../urjaai-integration/qa/mobile',{recursive:true});
 for(const [width,height] of [[320,800],[360,800],[375,667],[390,844],[412,915],[768,1024],[1024,768],[1440,900]]){
  await page.setViewportSize({width,height});
  for(const route of ['/', '/login','/signup','/forgot-password','/reset-password','/dashboard','/machines','/machines/new',machine!, '/energy','/alerts','/reports','/share',listing!,'/bookings','/organization','/settings','/admin','/missing-page']){
   await page.goto(route);await expect(page.locator('h1').last()).toBeVisible();await fits(page,`${width}: ${route}`);
  }
  await page.goto('/settings');
  for(const tab of ['Profile','Security','Notifications','Preferences']){await page.getByRole('button',{name:tab,exact:true}).click();await fits(page,`${width} settings ${tab}`);}
  await page.getByRole('button',{name:'Notifications',exact:true}).click();await expect(page.getByLabel('WhatsApp number')).toHaveAttribute('type','tel');
  if(width<=1024){expect(await page.getByLabel('WhatsApp number').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16);}
  await page.screenshot({path:`../urjaai-integration/qa/mobile/notifications-${width}.png`,fullPage:true});
  await page.goto(machine!);
  for(const tab of ['Overview','Telemetry','Calibration','Device','Share']){const button=page.getByRole('button',{name:tab,exact:true});if(await button.count()){await button.click();await fits(page,`${width} machine ${tab}`);}}
  await page.goto('/dashboard');await expect(page.getByRole('link',{name:'TEST ONLY VMC integration',exact:true})).toBeVisible();await expect(page.locator('.recharts-surface').first()).toBeVisible();await fits(page,`${width} populated dashboard`);await page.screenshot({path:`../urjaai-integration/qa/mobile/dashboard-${width}.png`,fullPage:true});
  if(width<=1024){await page.getByRole('button',{name:'Open navigation'}).click();const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();const box=await dialog.boundingBox();expect(box!.height).toBeLessThanOrEqual(height+1);await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await page.getByRole('button',{name:'Open navigation'}).click();await page.getByRole('dialog').getByRole('link',{name:'Energy',exact:true}).click();await expect(dialog).toBeHidden();await expect(page).toHaveURL(/energy/);}
 }
 expect(errors).toEqual([]);
});
