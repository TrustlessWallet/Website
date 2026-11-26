// Desktop follows scroll. On phones, the same controls select a compact slide.
const usableTour = matchMedia('(min-height: 480px)');
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
    const controls = document.createElement('div');
    controls.className = 'tour-controls';
    const buttons = steps.map((step, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(i + 1).padStart(2, '0');
      button.setAttribute('aria-label', step.querySelector('h3').textContent);
      button.addEventListener('click', () => {
        if (!wideTour.matches) {
          select(i);
          return;
        }
        step.scrollIntoView({
          block: 'center',
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
        });
      });
      controls.append(button);
      return button;
    });
    stage.append(controls);
    const detail = document.createElement('div');
    detail.className = 'tour-detail';
    detail.setAttribute('aria-hidden', 'true');
    stage.append(detail);
    let current = -1;
    let frame = 0;
    function select(next) {
      if (next === current) return;
      current = next;
      shots.forEach((shot, i) => {
        shot.classList.toggle('in-view', i === next);
        shot.inert = i !== next;
        steps[i].classList.toggle('current-step', i === next);
      });
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === next)));
      const image = shots[next].querySelector('img');
      detail.style.backgroundImage = 'url("' + image.src + '")';
      detail.dataset.screen = image.src.split('/').pop().split('.')[0];
      stage.style.setProperty('--chapter', next);
    }
    const sync = () => {
      frame = 0;
      if (!wideTour.matches) {
        select(Math.max(current, 0));
        return;
      }
      const center = innerHeight / 2;
      let next = 0;
      steps.forEach((step, i) => {
        if (step.getBoundingClientRect().top <= center) next = i;
      });
      select(next);
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
  unmount = usableTour.matches ? mountTours() : null;
}
wideTour.addEventListener('change', resizeTours);
usableTour.addEventListener('change', resizeTours);
resizeTours();
