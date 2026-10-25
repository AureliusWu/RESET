import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const out = resolve(root, 'game/assets/generated-portraits');
const expressions = ['neutral', 'smile', 'worried', 'surprised', 'serious', 'angry'];

const cast = {
  linwan: { name:'林晚', hair:'#202832', hairHi:'#34414d', eye:'#657f98', skin:'#f1d8cc', top:'#b9d3e2', accent:'#eef6fa', skirt:'#455565', style:'long', prop:'ribbon' },
  xiaoman: { name:'周小满', hair:'#704d3d', hairHi:'#9a6c50', eye:'#735d45', skin:'#f1d2c0', top:'#d8c3a5', accent:'#5e8f91', skirt:'#58666a', style:'short', prop:'clip' },
  xuqi: { name:'许栖', hair:'#d9dce2', hairHi:'#f2f3f7', eye:'#b99b55', skin:'#eed7cd', top:'#303743', accent:'#c2a867', skirt:'#222936', style:'silver', prop:'console' },
  tinglan: { name:'沈听澜', hair:'#272c31', hairHi:'#3c454b', eye:'#526c5d', skin:'#eed4c7', top:'#718c79', accent:'#dce7de', skirt:'#38443d', style:'glasses', prop:'book' },
  tangli: { name:'唐梨', hair:'#8b4e3d', hairHi:'#b46a50', eye:'#684b3f', skin:'#f0cfbd', top:'#d77a42', accent:'#292e35', skirt:'#343b43', style:'pony', prop:'headphones' },
  nanxing: { name:'乔南星', hair:'#282a3d', hairHi:'#4d4c74', eye:'#686a98', skin:'#efd4c8', top:'#4c526e', accent:'#a39ac8', skirt:'#303447', style:'star', prop:'phone' }
};

const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));

function eyes(expression, color) {
  const brows = expression === 'worried'
    ? '<path d="M270 326l42 10M450 336l42-10"/>'
    : (expression === 'serious' || expression === 'angry')
      ? '<path d="M270 336l42-10M450 326l42 10"/>'
      : '<path d="M270 326h42M450 326h42"/>';
  if (expression === 'smile') return `<g fill="none" stroke="#4b3b3a" stroke-width="7" stroke-linecap="round">${brows}<path d="M274 357q18 17 38 0M450 357q18 17 38 0"/></g>`;
  const ry = expression === 'surprised' ? 17 : 12;
  const pupilY = expression === 'angry' ? 363 : 360;
  return `<g fill="none" stroke="#4b3b3a" stroke-width="6" stroke-linecap="round">${brows}</g><g fill="${color}" stroke="#3a3030" stroke-width="5"><ellipse cx="294" cy="${pupilY}" rx="14" ry="${ry}"/><ellipse cx="468" cy="${pupilY}" rx="14" ry="${ry}"/></g><g fill="#fff"><circle cx="290" cy="${pupilY-6}" r="4"/><circle cx="464" cy="${pupilY-6}" r="4"/></g>`;
}

function mouth(expression) {
  if (expression === 'smile') return '<path d="M347 417q35 30 70 0" fill="none" stroke="#a45e5d" stroke-width="7" stroke-linecap="round"/>';
  if (expression === 'worried') return '<path d="M353 432q29-20 58 0" fill="none" stroke="#9a6661" stroke-width="6" stroke-linecap="round"/>';
  if (expression === 'surprised') return '<ellipse cx="382" cy="425" rx="13" ry="18" fill="#a86665"/>';
  if (expression === 'serious') return '<path d="M356 425h52" fill="none" stroke="#8d5a59" stroke-width="6" stroke-linecap="round"/>';
  if (expression === 'angry') return '<path d="M350 432q32-24 64 0" fill="none" stroke="#864d4d" stroke-width="7" stroke-linecap="round"/>';
  return '<path d="M363 425q19 7 38 0" fill="none" stroke="#9b615e" stroke-width="5" stroke-linecap="round"/>';
}

function hairBack(c) {
  if (c.style === 'pony') return `<path d="M221 330c-42 135-19 253 45 313l-40 170 77 30 50-261-45-273z" fill="${c.hair}"/><path d="M505 310c83 30 129 100 113 181-13 64-64 111-115 130l-35-65c61-20 92-53 87-99-4-42-29-64-73-78z" fill="${c.hair}"/>`;
  if (['long','silver','glasses','star'].includes(c.style)) return `<path d="M220 285c-44 136-20 362 17 535l72-18 13-292h123l10 292 78 19c36-193 54-403 9-536-41-121-276-122-322 0z" fill="${c.hair}"/>`;
  return `<path d="M222 289c-28 113-11 246 20 319l65-35-4-118h158l-5 120 63 32c31-91 43-219 15-319-39-120-270-121-312 1z" fill="${c.hair}"/>`;
}

function hairFront(c) {
  const base = `<path d="M245 291c13-100 72-162 139-162 78 0 134 69 142 165-51-43-102-61-158-55-48 5-83 21-123 52z" fill="${c.hair}"/><path d="M267 257c36-66 92-91 149-82-31 13-49 35-61 72 43-37 84-51 132-33-25 6-48 21-67 48" fill="${c.hairHi}" opacity=".55"/>`;
  if (c.style === 'silver') return base + `<path d="M263 280l40-81 24 88 35-108 30 105 39-92 20 91 44-69 8 109" fill="${c.hair}"/>`;
  if (c.style === 'short') return base + `<path d="M255 300q-30 70 17 142l38-74M508 300q30 70-17 142l-38-74" fill="${c.hair}"/>`;
  return base + `<path d="M257 296q-24 94 22 181l39-79M509 296q24 94-22 181l-39-79" fill="${c.hair}"/>`;
}

function accessory(c) {
  if (c.prop === 'ribbon') return `<path d="M367 540l-31 26 31 21 15-29 16 29 31-21-31-26z" fill="#6e94ad"/>`;
  if (c.prop === 'clip') return `<path d="M495 245l30-18 13 17-31 18z" fill="#e6b86e"/><path d="M360 615l88 12 18 122-97 8z" fill="#dbcaa8" stroke="#786c5e" stroke-width="5"/>`;
  if (c.prop === 'console') return `<rect x="337" y="648" width="96" height="55" rx="12" fill="#262b34" stroke="#c2a867" stroke-width="4"/><circle cx="355" cy="675" r="8" fill="#a7b1bb"/><circle cx="415" cy="675" r="6" fill="#a7b1bb"/>`;
  if (c.prop === 'book') return `<g stroke="#29372e" stroke-width="5"><ellipse cx="294" cy="360" rx="35" ry="29" fill="none"/><ellipse cx="468" cy="360" rx="35" ry="29" fill="none"/><path d="M329 360h104"/></g><path d="M350 650l105-18 12 139-105 18z" fill="#436250" stroke="#263b2f" stroke-width="5"/>`;
  if (c.prop === 'headphones') return `<path d="M305 543q77-62 154 0" fill="none" stroke="#262b30" stroke-width="15"/><rect x="292" y="530" width="28" height="55" rx="12" fill="#333941"/><rect x="447" y="530" width="28" height="55" rx="12" fill="#333941"/>`;
  if (c.prop === 'phone') return `<path d="M494 224l9 19 21 3-15 15 4 21-19-10-19 10 4-21-15-15 21-3z" fill="#a39ac8"/><rect x="405" y="651" width="61" height="105" rx="10" fill="#252938" stroke="#aaa4cc" stroke-width="5"/>`;
  return '';
}

function sprite(id, c, expression) {
  const seriousShadow = (expression === 'serious' || expression === 'angry') ? '.16' : '.08';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 1080" role="img" aria-label="${esc(c.name)} ${expression}">
<defs><linearGradient id="cloth" x2="0" y2="1"><stop stop-color="${c.top}"/><stop offset="1" stop-color="${c.skirt}"/></linearGradient><linearGradient id="skin" x2="0" y2="1"><stop stop-color="${c.skin}"/><stop offset="1" stop-color="#d7aa9b"/></linearGradient></defs>
<g stroke-linejoin="round" stroke-linecap="round">${hairBack(c)}
<path d="M318 456h128l19 102H299z" fill="url(#skin)"/>
<path d="M192 1018c20-219 50-386 98-488 25-53 67-74 92-74s67 21 92 74c48 102 78 269 98 488z" fill="url(#cloth)" stroke="#2c3943" stroke-width="7"/>
<path d="M289 530q93 48 186 0l-25 91q-68 34-136 0z" fill="${c.accent}" opacity=".88"/>
<ellipse cx="382" cy="344" rx="132" ry="157" fill="url(#skin)" stroke="#8d6f68" stroke-width="5"/>
<path d="M270 404q112 65 224 0c-13 72-56 112-112 112s-99-40-112-112z" fill="#a86d68" opacity="${seriousShadow}"/>
${hairFront(c)}${eyes(expression,c.eye)}${mouth(expression)}
<path d="M323 465q59 25 118 0" fill="none" stroke="#b48478" stroke-width="4" opacity=".45"/>
${accessory(c)}
<path d="M216 1018h332" stroke="#26333c" stroke-width="8" opacity=".45"/>
</g></svg>`;
}

await mkdir(out, { recursive: true });
for (const [id, character] of Object.entries(cast)) {
  const dir = resolve(out, id); await mkdir(dir, { recursive: true });
  for (const expression of expressions) await writeFile(resolve(dir, `${expression}.svg`), sprite(id, character, expression));
}
console.log(`Generated ${Object.keys(cast).length * expressions.length} locked anime-vector portrait variants`);
