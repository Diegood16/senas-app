// Run: node scripts/verify-project.cjs
// Synthetic checks verify code behavior, not recognition accuracy on real hands.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(relative) {
  const file = path.resolve(root, relative);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(
    name => load(path.relative(root, path.resolve(path.dirname(file), name + '.ts'))), module, module.exports
  );
  return module.exports;
}
const { GestureClassifier } = load('src/vision/GestureClassifier.ts');
const { LandmarkNormalizer } = load('src/vision/LandmarkNormalizer.ts');
const { DebounceEngine } = load('src/transcription/DebounceEngine.ts');
const { LiveTranscriptionEngine } = load('src/transcription/LiveTranscriptionEngine.ts');
const { PoseHoldEngine } = load('src/vision/PoseHoldEngine.ts');
const { RecognitionSamples } = load('src/vision/RecognitionSamples.ts');
const { DACTYLOLOGY_ALPHABET } = load('src/data/alphabetData.ts');
const { handQuality, distanceFeedback, CalibrationSession, getCalibration, forgetCalibration } = load('src/vision/RecognitionCalibration.ts');
const checks = [];
function check(name, fn) {
  try { fn(); checks.push({ name, passed: true }); }
  catch (error) { checks.push({ name, passed: false, error: error.message }); }
}
check('Catalogue: 21 letters, all images exist', () => {
  assert.equal(DACTYLOLOGY_ALPHABET.length, 21);
  for (const sign of DACTYLOLOGY_ALPHABET) assert.ok(fs.existsSync(path.join(root, 'public', sign.imagePath)));
});
check('Classifier rejects fewer than 21 points', () => assert.equal(GestureClassifier.classify([]), null));
const points = Array.from({ length: 21 }, (_, i) => ({ x: i / 30, y: i / 40, z: i / 100 }));
check('Normalization preserves geometry after translation and uniform scaling', () => {
  const a = LandmarkNormalizer.normalize(points);
  const b = LandmarkNormalizer.normalize(points.map(p => ({ x: p.x * 2 + 3, y: p.y * 2 - 4, z: p.z * 2 + 1 })));
  a.forEach((p, i) => ['x', 'y', 'z'].forEach(k => assert.ok(Math.abs(p[k] - b[i][k]) < 1e-10)));
});
check('Mirrored input plus mirror setting restores coordinates', () => {
  const a = LandmarkNormalizer.normalize(points);
  const b = LandmarkNormalizer.normalize(points.map(p => ({ ...p, x: 1 - p.x })), true);
  a.forEach((p, i) => assert.ok(Math.abs(p.x - b[i].x) < 1e-10));
});
check('Stable letter emits once; low confidence does not emit', () => {
  const engine = new DebounceEngine();
  assert.equal(engine.process('A', 0.94, 0).confirmedLetter, null);
  assert.equal(engine.process('A', 0.94, 450).confirmedLetter, 'A');
  assert.equal(engine.process('A', 0.94, 1000).confirmedLetter, null);
  assert.equal(engine.process('B', 0.2, 1500).confirmedLetter, null);
});
// Desired behavior: a single missing frame should not rearm a held letter.
check('Brief dropout after a long hold does not duplicate a letter', () => {
  const engine = new DebounceEngine();
  engine.process('A', 0.94, 0);
  engine.process('A', 0.94, 450);
  engine.process('A', 0.94, 2000);
  engine.process(null, 0, 2016);
  engine.process('A', 0.94, 2032);
  assert.equal(engine.process('A', 0.94, 2482).confirmedLetter, null);
});
// Isolate classifier rules by supplying controlled geometry, not a real pose.
const originalAnalyze = LandmarkNormalizer.analyzeGeometry;
function withGeometry(geometry, fn) {
  LandmarkNormalizer.analyzeGeometry = () => geometry;
  try { fn(); } finally { LandmarkNormalizer.analyzeGeometry = originalAnalyze; }
}
const folded = { isExtended: false, curl: 1 };
const extended = { isExtended: true, curl: 0 };
const base = {
  thumb: folded, index: folded, middle: folded, ring: folded, pinky: folded,
  isFist: false, isIndexPointingHorizontal: false, isMiddlePointingHorizontal: false,
  isIndexPointingDown: false, isIndexMiddleCrossed: false, thumbFistSlot: 'NONE',
  distances: { thumbToIndexTip: 0.5, thumbToMiddleTip: 0.5, indexTipToWrist: 1, indexToMiddleTip: 0.2 }
};
check('Vertical uncrossed U geometry must not be approved as target H', () => withGeometry({ ...base, index: extended, middle: extended }, () => {
  assert.equal(GestureClassifier.classify(points).letter, 'U');
  assert.notEqual(GestureClassifier.classify(points, false, 'H')?.letter, 'H');
}));
check('Vertical uncrossed U geometry must not be approved as target R', () => withGeometry({ ...base, index: extended, middle: extended }, () => {
  assert.equal(GestureClassifier.classify(points).letter, 'U');
  assert.notEqual(GestureClassifier.classify(points, false, 'R')?.letter, 'R');
}));
check('Repeat same letter allowed after sustained absence', () => {
  const engine = new DebounceEngine();
  engine.process('A', 0.94, 0); engine.process('A', 0.94, 450);
  engine.process(null, 0, 500); engine.process(null, 0, 1100);
  engine.process('A', 0.94, 1200);
  assert.equal(engine.process('A', 0.94, 1650).confirmedLetter, 'A');
});
const visiblePoints = points.map(p => ({ x: p.x * 0.4 + 0.3, y: p.y * 0.7 + 0.2, z: p.z }));
check('Quality gate rejects missing, non-finite, clipped and distant hands', () => {
  assert.equal(handQuality(visiblePoints), null);
  assert.ok(handQuality(null));
  assert.ok(handQuality(visiblePoints.map(p => ({ ...p, x: NaN }))));
  assert.ok(handQuality(visiblePoints.map(p => ({ ...p, x: 0.99 }))));
  assert.ok(handQuality(visiblePoints.map(() => ({ x: 0.5, y: 0.5, z: 0 }))));
});
const { pose, imagePoints } = require('./hand-fixtures.cjs');
check('General calibration scans open palm only; stores all finger lengths per hand', () => {
  forgetCalibration(false); forgetCalibration(true);
  const session = new CalibrationSession();
  let result;
  for (let i = 0; i < 25; i++) result = session.process(imagePoints(pose('B')), false, i * 70);
  assert.equal(result.done, true);
  const profile = getCalibration(false);
  assert.equal(profile.fingerLengths.length, 5);
  assert.ok(profile.fingerLengths.every(v => v > 0));
  assert.ok(profile.palmSize > 0);
  assert.equal(getCalibration(true), undefined);
  assert.ok(distanceFeedback(imagePoints(pose('B'), .08), profile).includes('lejos'));
});
check('Calibration rejects folded fingers and resets after lost tracking', () => {
  forgetCalibration(true);
  const session = new CalibrationSession();
  for (let i = 0; i < 30; i++) assert.equal(session.process(imagePoints(pose('D')), true, i * 70).done, false);
  for (let i = 0; i < 12; i++) session.process(imagePoints(pose('B')), true, 2200 + i * 70);
  assert.equal(session.process(null, true, 3100).progress, 0);
  for (let i = 0; i < 12; i++) assert.equal(session.process(imagePoints(pose('B')), true, 3200 + i * 70).done, false);
  assert.equal(getCalibration(true), undefined);
});
for (const { letter } of DACTYLOLOGY_ALPHABET) {
  check(`Full landmark pipeline: ${letter} at 3 distances, 2 aspect ratios and both hands`, () => {
    for (const scale of [.09, .14, .2]) for (const aspect of [4/3, 16/9]) for (const mirror of [false, true]) {
      const input = imagePoints(pose(letter), scale, aspect, mirror);
      assert.equal(handQuality(input), null);
      const output = GestureClassifier.classify(input, mirror, undefined, getCalibration(false));
      assert.equal(output?.letter, letter, `${letter}: scale=${scale}, aspect=${aspect}, mirror=${mirror}, got=${JSON.stringify(output)}`);
    }
  });
}
check('Target changes hints, never the inferred letter', () => {
  const input = imagePoints(pose('V'));
  const letters = DACTYLOLOGY_ALPHABET.map(s => GestureClassifier.classify(input, false, s.letter, getCalibration(false)).letter);
  assert.ok(letters.every(letter => letter === 'V'));
});
check('Academy hold pauses for short gaps without counting the gap as evidence', () => {
  const engine = new PoseHoldEngine();
  for (let t = 0; t <= 400; t += 50) assert.equal(engine.process('C', 'C', t, 800).confirmed, false);
  assert.equal(engine.process(null, 'C', 450, 800).progress, 50);
  assert.equal(engine.process('C', 'C', 500, 800).progress, 50);
  for (let t = 550; t < 900; t += 50) assert.equal(engine.process('C', 'C', t, 800).confirmed, false);
  assert.equal(engine.process('C', 'C', 900, 800).confirmed, true);
});
check('Academy hold resets on sustained mismatch, new target or sparse frames', () => {
  const engine = new PoseHoldEngine();
  for (let t=0;t<=400;t+=50) engine.process('D','D',t,800);
  assert.equal(engine.process('O','D',650,800).progress,0);
  engine.process('D','D',700,800);
  assert.equal(engine.process('E','E',750,800).progress,0);
  assert.equal(engine.process('E','E',2000,800).confirmed,false);
});
check('E with a small fingertip gap remains E instead of falling back to S', () => {
  const p = pose('E'); p[4].y += .09;
  assert.equal(GestureClassifier.classify(imagePoints(p), false, undefined, getCalibration(false)).letter, 'E');
});
function straightenThumb(p) {
  const tip = p[4], start = p[1];
  for (const [i,t] of [[2,.35],[3,.7]]) p[i] = { x: start.x+(tip.x-start.x)*t, y: start.y+(tip.y-start.y)*t, z: start.z+(tip.z-start.z)*t };
}
check('S accepts a straight crossed thumb rather than requiring a curled thumb', () => {
  const p = pose('S'); straightenThumb(p);
  assert.equal(GestureClassifier.classify(imagePoints(p), false, undefined, getCalibration(false)).letter, 'S');
});
check('T with a more visible straight thumb remains T', () => {
  const p = pose('T'); p[4].y = -1.35; straightenThumb(p);
  assert.equal(GestureClassifier.classify(imagePoints(p), false, undefined, getCalibration(false)).letter, 'T');
});
check('O with moderate fingertip depth disagreement remains O, not A', () => {
  const p = pose('O'); p[4].z += .32;
  assert.equal(GestureClassifier.classify(imagePoints(p), false, undefined, getCalibration(false)).letter, 'O');
});
check('N uses actual knuckle gaps when ring-knuckle spacing differs', () => {
  const p = pose('N'); for (let i=13;i<=16;i++) p[i].x += .27;
  p[4].x = .14;
  assert.equal(GestureClassifier.classify(imagePoints(p), false, undefined, getCalibration(false)).letter, 'N');
});
check('Uncertain N/M boundary is rejected instead of forced into M', () => {
  const p = pose('N');
  const centerN=(p[9].x+p[13].x)/2, centerM=(p[13].x+p[17].x)/2;
  p[4].x=(centerN+centerM)/2;
  assert.equal(GestureClassifier.classify(imagePoints(p), false, undefined, getCalibration(false)).letter, '');
});
check('P accepts contact on middle phalanx and a diagonal orientation', () => {
  const p = pose('P'); p[4] = {...p[10]};
  const angle = -70 * Math.PI / 180;
  const tilted = p.map(v => ({ x: v.x*Math.cos(angle)-v.y*Math.sin(angle), y: v.x*Math.sin(angle)+v.y*Math.cos(angle), z:v.z }));
  assert.equal(GestureClassifier.classify(imagePoints(tilted), false, undefined, getCalibration(false)).letter, 'P');
});
check('Measurement buffer contains points only, is bounded and copies its input', () => {
  const buffer = new RecognitionSamples();
  assert.equal(buffer.snapshot('E', 'Right'), null);
  const p = imagePoints(pose('E'));
  for(let t=0;t<=5000;t+=90) buffer.add(t,p,'S');
  const snapshot=JSON.parse(buffer.snapshot('E','Right'));
  assert.ok(snapshot.frames.length<=40);
  assert.ok(snapshot.frames.at(-1).timeMs-snapshot.frames[0].timeMs<=3000);
  p[4].x=99;
  assert.notEqual(JSON.parse(buffer.snapshot('E','Right')).frames[0].points[4].x,99);
  assert.equal(snapshot.intendedLetter,'E');
  assert.equal(snapshot.frames[0].detected,'S');
});
check('Crossed thumb at knuckle height is S even when its tip lies in the T gap', () => {
  const geometry = { ...base, isFist: true, thumb: extended, thumbFistSlot: 'T', distances: {
    ...base.distances, indexLength: 1, middleLength: 1, compactCount: 3,
    thumbToIndexTip: .25, thumbToMiddleTip: .2, thumbAcross: .2, thumbAlong: 1.1, tipAlong: 1,
    thumbTerminalAcross: .16, thumbTerminalAlong: .27
  }};
  withGeometry(geometry, () => {
    for (const {letter} of DACTYLOLOGY_ALPHABET) assert.equal(GestureClassifier.classify(points, false, letter).letter, 'S');
  });
});
check('Fingertip contact alone cannot change a crossing S into E', () => {
  const geometry = { ...base, isFist: true, thumbFistSlot: 'T', distances: {
    ...base.distances, indexLength: 1, middleLength: 1, compactCount: 3,
    thumbToIndexTip: .26, thumbToMiddleTip: .05, thumbAcross: .26, thumbAlong: 1.04, tipAlong: 1.08,
    thumbTerminalAcross: .21, thumbTerminalAlong: .22
  }};
  withGeometry(geometry, () => assert.equal(GestureClassifier.classify(points).letter, 'S'));
  withGeometry({ ...geometry, distances: { ...geometry.distances, thumbTerminalAcross: .02, thumbTerminalAlong: .25 } }, () => {
    assert.equal(GestureClassifier.classify(points).letter, 'E');
  });
});
function liveDriver(engine = new LiveTranscriptionEngine()) {
  let now = 0;
  const events = [];
  return {
    engine, events,
    run(letter, duration, options = {}) {
      const end = now + duration;
      for (;now < end;now+=40) {
        const decision = engine.process({ letter, score: letter ? .9 : 0, tracking: 'ready', now, ...options });
        if (decision.confirmedLetter) events.push(decision.confirmedLetter);
        if (decision.addSpace) events.push(' ');
      }
    }
  };
}
check('Live spelling confirms stable letters once and ignores brief transitional letters', () => {
  const live = liveDriver();
  live.run('A',1000); live.run('B',160); live.run('A',1000); live.run('C',1000);
  assert.deepEqual(live.events,['A','C']);
});
check('Live spelling counts observations, not sparse frames or long camera stalls', () => {
  const engine = new LiveTranscriptionEngine();
  for (const now of [0,1000,2000,3000]) assert.equal(engine.process({ letter:'A',score:.9,tracking:'ready',now }).confirmedLetter,null);
});
check('Continuous low-frame-rate tracking can still confirm a stable pose conservatively', () => {
  const engine=new LiveTranscriptionEngine();
  const emitted=[];
  for(let now=0;now<=2200;now+=200) {
    const result=engine.process({letter:'S',score:.9,tracking:'ready',now});
    if(result.confirmedLetter) emitted.push(result.confirmedLetter);
  }
  assert.deepEqual(emitted,['S']);
});
check('Ambiguity, poor tracking and recalibration do not duplicate a held letter or add spaces', () => {
  for (const options of [{tracking:'ready'}, {tracking:'poor-quality'}, {tracking:'calibrating'}]) {
    const live=liveDriver(); live.run('A',1000); live.run(null,2000,options); live.run('A',1000);
    assert.deepEqual(live.events,['A']);
  }
});
check('Actual hand absence rearms repeated letters and adds one space only after a long pause', () => {
  const live=liveDriver();
  live.run('A',1000); live.run(null,760,{tracking:'absent'}); live.run('A',1000);
  assert.deepEqual(live.events,['A','A']);
  live.run(null,2400,{tracking:'absent'}); live.run(null,1000,{tracking:'absent'});
  assert.deepEqual(live.events,['A','A',' ']);
});
check('Brief lost tracking pauses confirmation without counting missing time', () => {
  const live=liveDriver();
  live.run('A',400); live.run(null,120,{tracking:'absent'}); live.run('A',320);
  assert.deepEqual(live.events,[]);
  live.run('A',160); assert.deepEqual(live.events,['A']);
});
check('Live pause/resume preserves duplicate suppression; explicit Repeat permits the same letter', () => {
  const live=liveDriver(); live.run('S',1000); live.engine.interrupt(); live.run('S',1000);
  assert.deepEqual(live.events,['S']);
  live.engine.allowRepeat(); live.run('S',1000); assert.deepEqual(live.events,['S','S']);
});
check('Slower personal pace changes required stable time, not the recognized letter', () => {
  const live=liveDriver(); live.engine.setHoldMs(1100); live.run('E',1000); assert.deepEqual(live.events,[]);
  live.run('E',200); assert.deepEqual(live.events,['E']);
});
check('Low-score guesses never enter live text', () => {
  const live=liveDriver(); live.run('S',3000,{score:.5}); assert.deepEqual(live.events,[]);
});
check('Live motion gate rejects changing joint geometry even if the classifier label is constant', () => {
  const live=liveDriver();
  for(let i=0;i<30;i++) live.run('A',40,{points:imagePoints(pose(i%2 ? 'B' : 'A'))});
  assert.deepEqual(live.events,[]);
  live.run('A',1000,{points:imagePoints(pose('A'))}); assert.deepEqual(live.events,['A']);
});
check('Transcription samples preserve sequence context and never use intended text for classification', () => {
  const buffer=new RecognitionSamples(12000,160);
  for(let now=0;now<14000;now+=90) buffer.add(now,imagePoints(pose('S')),'S',{tracking:'ready',confirmedLetter:now===900 ? 'S' : null,paused:false});
  const sample=JSON.parse(buffer.snapshotTranscription('HOLA','SS','Right'));
  assert.equal(sample.version,2); assert.equal(sample.intendedText,'HOLA'); assert.equal(sample.actualText,'SS');
  assert.ok(sample.frames.length>40 && sample.frames.length<=160);
  assert.ok(sample.frames.every(frame=>frame.detected==='S'));
});
check('Transcription samples retain confirmed events between periodic frames and personal pace', () => {
  const buffer=new RecognitionSamples(12000,160);
  buffer.add(0,imagePoints(pose('S')),'S',{tracking:'ready'});
  buffer.add(30,imagePoints(pose('S')),'S',{tracking:'ready',confirmedLetter:'S'});
  const sample=JSON.parse(buffer.snapshotTranscription('S','S','Right',undefined,1100));
  assert.equal(sample.frames.length,2);
  assert.equal(sample.frames[1].confirmedLetter,'S'); assert.equal(sample.holdMs,1100);
});
for (const result of checks) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.error ? '\n  ' + result.error : ''}`);
console.log(`\n${checks.filter(c => c.passed).length}/${checks.length} checks passed. Synthetic checks are not real-world accuracy measurements.`);
process.exitCode = checks.every(c => c.passed) ? 0 : 1;
// Replay locally saved measurements. The intended letter is not treated as ground truth.
const sampleArgument = process.argv.indexOf('--sample');
if (sampleArgument >= 0) {
  const sample = JSON.parse(fs.readFileSync(process.argv[sampleArgument + 1], 'utf8'));
  if (![1,2].includes(sample.version) || !Array.isArray(sample.frames) || sample.frames.length > (sample.version === 1 ? 40 : 160)) throw new Error('Unsupported measurement file');
  const counts = {};
  const features = [];
  const hold = new PoseHoldEngine();
  const live = new LiveTranscriptionEngine(sample.holdMs || 700);
  let replayedText = '';
  let firstConfirmationMs = null;
  const expectedArgument = process.argv.indexOf('--expect');
  const expected = expectedArgument >= 0 ? process.argv[expectedArgument + 1] : null;
  for (const frame of sample.frames) {
    const points = frame.points;
    let label = 'sin puntos';
    if (points) {
      points.aspectRatio = frame.aspectRatio;
      label = GestureClassifier.classify(points, sample.hand === 'Right', undefined, sample.calibration)?.letter || 'rechazo';
      const geo = LandmarkNormalizer.analyzeGeometry(LandmarkNormalizer.normalize(points, sample.hand === 'Right'));
      features.push({ slot: geo.thumbFistSlot, fist: geo.isFist, compact: geo.distances.compactCount,
        indexContact: geo.distances.thumbToIndexTip / (sample.calibration?.fingerLengths[1] || geo.distances.indexLength),
        middleContact: geo.distances.thumbToMiddleTip / (sample.calibration?.fingerLengths[2] || geo.distances.middleLength),
        thumbAcross: geo.distances.thumbAcross, thumbAlong: geo.distances.thumbAlong,
        tipAlong: geo.distances.tipAlong, thumbExtended: geo.thumb.isExtended,
        terminalAcross: geo.distances.thumbTerminalAcross, terminalAlong: geo.distances.thumbTerminalAlong });
    }
    counts[label] = (counts[label] || 0) + 1;
    if (expected && points) assert.equal(label, expected, 'Unexpected prediction in supplied replay sample');
    if (!frame.paused) {
      const decision=live.process({letter: label.length===1 ? label : null,score:label.length===1 ? .9 : 0,tracking:frame.tracking || (points ? 'ready' : 'absent'),points,now:frame.timeMs});
      if (decision.confirmedLetter) replayedText+=decision.confirmedLetter;
      if (decision.addSpace && replayedText && !replayedText.endsWith(' ')) replayedText+=' ';
    } else live.interrupt();
    const state = hold.process(label === 'rechazo' || label === 'sin puntos' ? null : label, sample.intendedLetter, frame.timeMs, 800);
    if (state.confirmed && firstConfirmationMs === null) firstConfirmationMs = Math.round(frame.timeMs - sample.frames[0].timeMs);
  }
  console.log(JSON.stringify({ intendedLetter: sample.intendedLetter, intendedText: sample.intendedText, replayedPredictions: counts, firstAcademyConfirmationMs: firstConfirmationMs, replayedLiveText: replayedText, note: 'Replay covers only the buffered interval. Frame counts are not accuracy measurements or independent attempts.' }, null, 2));
  if (expected) assert.notEqual(firstConfirmationMs, null, 'Replay must also confirm the target in Academy');
  if (process.argv.includes('--features')) console.log(JSON.stringify(features, null, 2));
}
