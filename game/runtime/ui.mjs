const UI_BASE = './assets/4k/runtime/ui/';
const UI = {
  title: UI_BASE + 'title-key-visual.webp',
  save: UI_BASE + 'save-anomaly.webp',
  endings: UI_BASE + 'ending-collection-header.webp',
  gallery: UI_BASE + 'cg-gallery-header.webp',
  combat: UI_BASE + 'combat-hud-key-visual.webp'
};

export function mountUiBridge(game) {
  const { session, renderer } = game;
  const host = renderer.element;
  const doc = host.ownerDocument;
  let disposed = false;

  const makeImage = (src, id, alt, className = 'reset-ui-header') => {
    const image = doc.createElement('img');
    image.src = src;
    image.alt = alt;
    image.className = className;
    image.dataset.uiVisual = id;
    image.decoding = 'async';
    return image;
  };

  function syncTitle() {
    if (disposed) return;
    const stage = host.querySelector('.vn-stage');
    if (!stage) return;
    const show = session.getView().frame.sceneId === 'prologue_1842';
    let image = stage.querySelector('[data-ui-visual="title-key-visual"]');
    if (show && !image) {
      image = makeImage(UI.title, 'title-key-visual', '回留 RESET · 18:42', 'reset-title-key-visual');
      stage.append(image);
    } else if (!show && image) image.remove();
  }

  function insertAfter(reference, node) {
    reference.parentNode?.insertBefore(node, reference.nextSibling);
  }

  function decorateArchive() {
    if (disposed) return;
    const modal = host.querySelector('.reset-dialog');
    const panel = modal?.querySelector('.reset-panel');
    const head = panel?.querySelector('.reset-panel-head');
    if (!panel || !head || modal.hidden) return;
    const page = modal.dataset.page;

    if (page === 'slots' && !panel.querySelector('[data-ui-visual="save-anomaly"]')) {
      insertAfter(head, makeImage(UI.save, 'save-anomaly', '异常存档 · 10月17日 18:42'));
    }
    if (page === 'collection') {
      if (!panel.querySelector('[data-ui-visual="ending-collection-header"]')) {
        insertAfter(head, makeImage(UI.endings, 'ending-collection-header', '结局收藏关键视觉'));
      }
      if (!panel.querySelector('[data-ui-visual="cg-gallery-header"]')) {
        const galleryHeading = [...panel.querySelectorAll('h3')].find(node => node.textContent === 'CG 图鉴');
        if (galleryHeading) panel.insertBefore(makeImage(UI.gallery, 'cg-gallery-header', 'CG 图鉴关键视觉'), galleryHeading);
      }
    }
  }

  function decorateCombat() {
    if (disposed) return;
    for (const overlay of doc.querySelectorAll('.reset-combat')) {
      overlay.classList.add('reset-round7-ui');
      overlay.dataset.uiVisual = 'combat-hud-key-visual';
      overlay.style.setProperty('--reset-combat-key-visual', `url("${UI.combat}")`);
    }
  }

  const sync = () => { syncTitle(); decorateArchive(); decorateCombat(); };
  const unsubscribe = session.subscribe(sync);
  const observer = new MutationObserver(sync);
  observer.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'data-page'] });
  sync();

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      unsubscribe();
      observer.disconnect();
      host.querySelectorAll('[data-ui-visual="title-key-visual"],[data-ui-visual="save-anomaly"],[data-ui-visual="ending-collection-header"],[data-ui-visual="cg-gallery-header"]').forEach(node => node.remove());
      doc.querySelectorAll('.reset-combat.reset-round7-ui').forEach(node => {
        node.classList.remove('reset-round7-ui');
        node.style.removeProperty('--reset-combat-key-visual');
        delete node.dataset.uiVisual;
      });
    }
  };
}
