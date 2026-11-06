import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.addInitScript(()=>{
 let pending=[],now=0;
 window.requestAnimationFrame=callback=>{pending.push(callback);return pending.length;};
 window.advanceStoryboard=milliseconds=>{for(let i=0;i<milliseconds;i+=50){now+=50;const callbacks=pending;pending=[];callbacks.forEach(callback=>callback(now));}};
});
await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:4173');
assert.equal(await page.locator('#opening-fade').evaluate(e=>e.style.opacity),'1');
assert.equal(await page.locator('#enter-game').isVisible(),false);
await page.locator('#skip-intro').click();assert.equal(await page.locator('main').evaluate(e=>e.inert),false);
assert.ok(await page.locator('#game').evaluate(e=>e.gameState));
await page.locator('#replay-intro').click();assert.equal(await page.locator('#opening-fade').evaluate(e=>e.style.opacity),'1');
let previous=0;
for(const [milliseconds,beat] of [[400,'bed'],[1500,'bed'],[3200,'meadow'],[4600,'storm'],[6400,'rescue'],[8700,'logo']]){
 await page.evaluate(ms=>window.advanceStoryboard(ms),milliseconds-previous);previous=milliseconds;
 assert.equal(await page.locator('#opening').getAttribute('data-beat'),beat);
 if(milliseconds<7800)assert.equal(await page.locator('#opening-title').evaluate(e=>e.classList.contains('visible')),false);
}
await page.evaluate(()=>document.fonts.ready);
assert.ok(await page.evaluate(()=>document.fonts.check('44px "Plush Jua"','달려라! 인형친구들')));
assert.ok(await page.evaluate(()=>document.fonts.check('13px "Gowun Dodum"','차원의 틈 너머로')));
assert.equal(await page.locator('#enter-game').isVisible(),true);
await page.locator('#intro-sound').click();assert.equal(await page.locator('#intro-sound').getAttribute('aria-pressed'),'true');
await page.locator('#enter-game').click();assert.equal(await page.locator('#opening').isVisible(),false);
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
await page.emulateMedia({reducedMotion:'reduce'});await page.reload();
await page.evaluate(()=>window.advanceStoryboard(50));await page.locator('#enter-game').waitFor();
await page.locator('#enter-game').click();await page.locator('#replay-intro').click();
await page.evaluate(()=>window.advanceStoryboard(50));assert.equal(await page.locator('#enter-game').isVisible(),true);
await page.locator('#skip-intro').click();assert.equal(await page.locator('#opening').isVisible(),false);
assert.deepEqual(errors,[]);
console.log('PASS black/replay, bed → meadow → storm → rescue → final logo, local Korean fonts, audio opt-in, skip/start, mobile width, JS errors');
await browser.close();
