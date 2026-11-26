// Keep the original screenshots inline on small displays and without JavaScript.
const wideTour = matchMedia('(min-width: 800px) and (min-height: 520px)');
const mountTours = () => {
  const cleanups = [];
  for (const track of document.querySelectorAll('#checkout ol, .story-grid')) {
    const steps = Array.from(track.children);
    const shots = steps.map(step => step.querySelector('.story-shot, .sale-screen'));
    const stage = document.createElement('div');
    stage.className = 'tour-stage';
    track.before(stage);
    track.parentElement.classList.add('tour-layout');
    shots.forEach(shot => stage.append(shot));
    let current = -1;
    let frame = 0;
    const sync = () => {
      frame = 0;
      const center = innerHeight / 2;
      let next = 0;
      steps.forEach((step, i) => {
        if (step.getBoundingClientRect().top <= center) next = i;
      });
      if (next === current) return;
      current = next;
      shots.forEach((shot, i) => {
        shot.classList.toggle('in-view', i === next);
        shot.inert = i !== next;
        steps[i].classList.toggle('current-step', i === next);
      });
      stage.style.setProperty('--chapter', next);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(sync); };
    sync();
    addEventListener('scroll', schedule, {passive:true});
    addEventListener('resize', schedule);
    cleanups.push(() => {
      removeEventListener('scroll', schedule);
      removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
      shots.forEach((shot, i) => {
        shot.inert = false;
        shot.classList.remove('in-view');
        steps[i].classList.remove('current-step');
        steps[i].prepend(shot);
      });
      track.parentElement.classList.remove('tour-layout');
      stage.remove();
    });
  }
  return () => cleanups.forEach(clean => clean());
};
let unmount;
function resizeTours() {
  unmount?.();
  unmount = wideTour.matches ? mountTours() : null;
}
wideTour.addEventListener('change', resizeTours);
resizeTours();
