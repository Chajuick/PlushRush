// The build injects the same release into the client and version.json.
const current = __APP_RELEASE__;
const notice = document.querySelector('#update-notice');
const apply = document.querySelector('#apply-update');
document.querySelector('#app-version').textContent = current.version;
let latest, dismissed, checking = false;
async function checkForUpdate() {
  if (checking || document.hidden) return;
  checking = true;
  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, {cache:'no-store',headers:{'Cache-Control':'no-cache'}});
    if (!response.ok) return;
    const release = await response.json();
    if (typeof release.buildId !== 'string' || typeof release.version !== 'string') return;
    if (release.buildId === current.buildId) { notice.hidden = true; latest = undefined; return; }
    latest = release;
    if (dismissed !== release.buildId) {
      document.querySelector('#update-description').textContent = `v${current.version} → v${release.version} · 진행 중인 게임은 다시 시작됩니다.`;
      notice.hidden = false;
    }
  } catch { /* Offline and unavailable manifests must not interrupt gameplay. */ }
  finally { checking = false; }
}
document.querySelector('#dismiss-update').addEventListener('click',()=>{dismissed=latest?.buildId;notice.hidden=true;});
apply.addEventListener('click', async()=>{
  if (!latest) return;
  apply.disabled=true;apply.textContent='최신 버전 불러오는 중…';
  // Cache-busting HTML + content-hashed assets supplies a fresh application.
  // Preserve localStorage (including scores); this app does not install a service worker.
  const url=new URL(location.href);url.searchParams.set('release',latest.buildId);
  location.replace(url.href);
});
setInterval(checkForUpdate,60000);
window.addEventListener('focus',checkForUpdate);
window.addEventListener('online',checkForUpdate);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkForUpdate();});
void checkForUpdate();
