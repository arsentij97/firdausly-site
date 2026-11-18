/*
  Превью v8: готовит картинки, ролики и звук из mobile/assets и supabase/seed.
    node site/_preview/v8/_prep.mjs posters   кадры-обложки всех роликов (для выбора), в папку из аргумента
    node site/_preview/v8/_prep.mjs           картины, символы, иконка, ролики (1080p) и азан
  ffmpeg берётся из python-пакета imageio_ffmpeg (как в supabase/seed/reels-firdausly.mjs).
  Файлы на сайт: i/ (картинки), v/ (ролики, обложки, звук). Файлы с «_» на сайт не едут.
*/
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const A = (p) => path.join(repo, 'mobile/assets', p);
const FF = execFileSync('python', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim();
const ff = (args) => execFileSync(FF, ['-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
const I = (p) => path.join(here, 'i', p);
const V = (p) => path.join(here, 'v', p);
fs.mkdirSync(I(''), { recursive: true });
fs.mkdirSync(V(''), { recursive: true });

const man = JSON.parse(fs.readFileSync(path.join(repo, 'supabase/seed/reels-firdausly.json'), 'utf8')).items;
const reel = (n) => man.find((x) => x.n === n);

if (process.argv[2] === 'posters') {
  const out = process.argv[3];
  for (const x of man) ff(['-ss', (x.cover_ms / 1000).toFixed(2), '-i', path.join(repo, 'supabase/seed', x.file), '-frames:v', '1', '-vf', 'scale=240:-2', '-q:v', '5', path.join(out, `r${String(x.n).padStart(2, '0')}.jpg`)]);
  process.exit(0);
}

const only = new Set(process.argv.slice(2));
const want = (k) => !only.size || only.has(k);

/* картины: webp + avif двух ширин и крошечная размытая заглушка */
const pic = (src, name, widths) => {
  for (const w of widths) {
    ff(['-i', src, '-vf', `scale=${w}:-2:flags=lanczos`, '-c:v', 'libwebp', '-quality', '80', I(`${name}-${w}.webp`)]);
    ff(['-i', src, '-vf', `scale=${w}:-2:flags=lanczos`, '-c:v', 'libaom-av1', '-still-picture', '1', '-crf', '30', '-cpu-used', '6', '-pix_fmt', 'yuv420p', I(`${name}-${w}.avif`)]);
  }
  ff(['-i', src, '-vf', 'scale=24:-2', '-c:v', 'libwebp', '-quality', '40', I(`${name}-b.webp`)]);
};
if (want('pics')) {
  pic(A('scene-lions.jpg'), 'lions', [640, 1206]);
  for (const s of ['plus', 'gate', 'road', 'sujud', 'storm']) pic(A(`scene-${s}.jpg`), s, [480, 860]);
  for (const s of ['guremir', 'cairo', 'nile', 'samarkand', 'fountain', 'caravan', 'mutawalli', 'terrace']) pic(A(`classic-${s}.jpg`), `c-${s}`, [480]);
  ff(['-i', A('icon.png'), '-vf', 'scale=192:192', '-c:v', 'libwebp', '-quality', '90', I('icon.webp')]);
  for (const f of fs.readdirSync(A('intro-symbols'))) ff(['-i', A(`intro-symbols/${f}`), '-vf', 'scale=144:144', '-c:v', 'libwebp', '-quality', '86', I(f.replace('sym-', 's-'))]);
}

/* ролики бренда @firdausly: 1080×1920 H.264 (лучшее, что отдаёт телефон без HLS), обложка — кадр обложки из манифеста */
export const REELS = [12, 2, 18, 25, 4, 14, 23, 29, 24];
if (want('reels')) {
  for (const n of REELS) {
    const x = reel(n), src = path.join(repo, 'supabase/seed', x.file), id = `r${n}`;
    if (!fs.existsSync(V(`${id}.mp4`))) ff(['-i', src, '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-maxrate', '5M', '-bufsize', '10M', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-vf', 'scale=1080:1920:flags=lanczos', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', V(`${id}.mp4`)]);
    ff(['-ss', (x.cover_ms / 1000).toFixed(2), '-i', src, '-frames:v', '1', '-vf', 'scale=540:-2:flags=lanczos', '-c:v', 'libwebp', '-quality', '78', V(`${id}.webp`)]);
  }
}

/* азан «Оман» (CC0, denkmal, freesound 682084) — 14 секунд для прослушивания на странице */
if (want('adhan')) ff(['-i', A('sounds/fd_adhan_oman.caf'), '-t', '14', '-af', 'afade=t=out:st=12:d=2', '-c:a', 'aac', '-b:a', '96k', V('adhan-oman.m4a')]);

const kb = (d) => fs.readdirSync(d).reduce((s, f) => s + fs.statSync(path.join(d, f)).size, 0) / 1024;
console.log(`i/ ${kb(I('')).toFixed(0)} КБ, v/ ${(kb(V('')) / 1024).toFixed(1)} МБ`);
