//Breadcrumb trail for the Read section (Books › Genesis › Chapter 3), so users can step back
//up a level without leaving the tab. Renders into a <nav class="breadcrumbs"><ol></ol></nav>.
//items: [{ label, href }] from the top level down; the last item is the current page (no link).
const renderBreadcrumbs = (nav, items) => {
  const list = nav.querySelector('ol');
  list.innerHTML = '';
  items.forEach(({ label, href }, i) => {
    const li = document.createElement('li');
    const isCurrent = i === items.length - 1;
    if (isCurrent) {
      const span = document.createElement('span');
      span.setAttribute('aria-current', 'page');
      span.textContent = label;
      li.appendChild(span);
    } else {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      li.appendChild(a);
    }
    list.appendChild(li);
  });
  nav.hidden = false;
}

export { renderBreadcrumbs };
