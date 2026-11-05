// Mathematical poses, not captured hands. No claim of real-world accuracy.
const point = (x, y, z = 0) => ({ x, y, z });
function pose(letter) {
  const p = Array.from({ length: 21 }, () => point(0, 0));
  const bases = [[-.45, -1], [-.15, -1.08], [.18, -1], [.45, -.85]];
  const extended = { B: [1,1,1,1], U: [1,1,0,0], V: [1,1,0,0], H: [1,1,0,0], D: [1,0,0,0], I: [0,0,0,1], W: [1,1,1,0], P: [1,1,0,0], G: [1,0,0,0], F: [0,1,1,1], L: [1,0,0,0], R: [1,1,0,0], Y: [0,0,0,1] }[letter] || [0,0,0,0];
  for (let f = 0; f < 4; f++) {
    const i = 5 + f * 4, [x,y] = bases[f]; p[i] = point(x,y);
    if (extended[f]) {
      const dx = letter === 'V' ? (f === 0 ? -.4 : .3) : letter === 'R' ? (f === 0 ? .35 : -.3) : f < 2 ? .08 : 0;
      p[i+1] = point(x+dx*.45,y-.5); p[i+2] = point(x+dx*.8,y-.85); p[i+3] = point(x+dx,y-1.1);
    } else {
      p[i+1] = point(x,y-.4); p[i+2] = point(x,y-.13,-.2); p[i+3] = point(x,y+.05,-.12);
    }
  }
  p[1]=point(-.3,-.25); p[2]=point(-.6,-.45); p[3]=point(-.25,-.55); p[4]=point(-.1,-.6);
  if (['D','P'].includes(letter)) p[4]={...p[12]};
  if (['C','O'].includes(letter)) {
    for (let f=0;f<4;f++) {
      const i=5+f*4, [x,y]=bases[f];
      p[i+1]=point(x,y-.6);
      p[i+2]=point(x*.5,-1.9,-.1);
      p[i+3]=point(x*.4,-1.65,-.25);
    }
    p[4]=letter === 'O' ? point(-.1,-1.65,-.25) : point(-.65,-1.25,-.15);
  }
  if (['T','N','M'].includes(letter)) {
    const x={T:-.28,N:0,M:.3}[letter];
    p[4]=point(x,-1.08,-.2);
  }
  if (letter === 'E') p[4]=point(-.22,-.99,-.12);
  if (letter === 'S') p[4]=point(0,-.65,-.2);
  if (['A','L','Y'].includes(letter)) { p[3]=point(-.85,-.6); p[4]=point(-1.1,-.75); }
  if (letter === 'F') p[4]={...p[8]};
  if (letter === 'G') { p[3]=point(-.85,-.6); p[4]=point(-1.1,-.75); }
  if (['H','G'].includes(letter)) for (let i=0;i<21;i++) p[i]=point(-p[i].y,p[i].x,p[i].z);
  if (letter === 'P') for (let i=0;i<21;i++) p[i]=point(-p[i].x,-p[i].y,p[i].z);
  return p;
}
function imagePoints(p, scale = .16, aspectRatio = 4/3, mirror = false) {
  const centerX = (Math.min(...p.map(v => v.x)) + Math.max(...p.map(v => v.x))) / 2;
  const centerY = (Math.min(...p.map(v => v.y)) + Math.max(...p.map(v => v.y))) / 2;
  const image = p.map(v => point(.5 + (v.x-centerX)*scale*(mirror ? -1 : 1), .5 + (v.y-centerY)*scale*aspectRatio, v.z*scale));
  image.aspectRatio = aspectRatio;
  return image;
}
module.exports = { pose, imagePoints };
