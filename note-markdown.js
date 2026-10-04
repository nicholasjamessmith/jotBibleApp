//Markdown for notes - notes are stored as plain markdown text, rendered with marked +
//DOMPurify (loaded from cdnjs as window.marked / window.DOMPurify on pages that render),
//and edited in a plain <textarea> with a small toolbar and list continuation on Enter.

//Renders a note's markdown into el. Falls back to plain text if the libraries didn't load
//(e.g. offline), so a note is always readable.
const renderMarkdown = (el, text) => {
  if (!window.marked || !window.DOMPurify) {
    el.textContent = text;
    el.classList.add('note-plain');
    return;
  }
  el.classList.remove('note-plain');
  const html = window.marked.parse(text, { gfm: true, breaks: true });
  el.innerHTML = window.DOMPurify.sanitize(html);
}

//Plain-text version for previews (note list, reader's Linked list) - drops list markers,
//heading hashes, and emphasis/code punctuation but keeps the words and line breaks.
const stripMarkdown = (text) => text
  .replace(/^\s{0,3}#{1,6}\s+/gm, '')
  .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, '')
  .replace(/^\s*>\s?/gm, '')
  .replace(/(\*\*|__)(.+?)\1/g, '$2')
  .replace(/(\*|_)(.+?)\1/g, '$2')
  .replace(/`([^`]+)`/g, '$1');

//Replaces the textarea's selection via execCommand when available, so the edit lands in the
//browser's undo history and fires an "input" event (drafts listen for it)
const replaceSelection = (textarea, text) => {
  textarea.focus();
  if (!document.execCommand?.('insertText', false, text)) {
    textarea.setRangeText(text, textarea.selectionStart, textarea.selectionEnd, 'end');
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

const LIST_ITEM = /^(\s*)([-*+]|(\d+)[.)])\s+/;

//Expands the selection to whole lines, then adds the list marker to each (or removes it if
//every line already has one) - one click turns a block of lines into a list and back
const toggleList = (textarea, numbered) => {
  const { value } = textarea;
  const start = value.lastIndexOf('\n', textarea.selectionStart - 1) + 1;
  const endBreak = value.indexOf('\n', textarea.selectionEnd);
  const end = endBreak === -1 ? value.length : endBreak;
  const lines = value.slice(start, end).split('\n');
  const marker = (i) => (numbered ? `${i + 1}. ` : '- ');
  const isSameList = (line) => (numbered ? /^\s*\d+[.)]\s+/ : /^\s*[-*+]\s+/).test(line);

  const allListed = lines.every(isSameList);
  const updated = lines.map((line, i) => {
    const bare = line.replace(LIST_ITEM, '$1');
    return allListed ? bare : bare.replace(/^(\s*)/, `$1${marker(i)}`);
  });
  const replacement = updated.join('\n');
  textarea.setSelectionRange(start, end);
  replaceSelection(textarea, replacement);
  //Keep the lines selected so clicking again toggles the whole block back
  textarea.setSelectionRange(start, start + replacement.length);
}

//Wraps the selection in ** (or inserts **** with the caret in the middle)
const toggleBold = (textarea) => {
  const { selectionStart, selectionEnd, value } = textarea;
  const selected = value.slice(selectionStart, selectionEnd);
  replaceSelection(textarea, `**${selected}**`);
  if (!selected) textarea.setSelectionRange(selectionStart + 2, selectionStart + 2);
}

//Enter on a list line starts the next item; Enter on an empty item ends the list
const handleListEnter = (e) => {
  const textarea = e.target;
  if (e.key !== 'Enter' || e.shiftKey || e.isComposing || textarea.selectionStart !== textarea.selectionEnd) return;
  const { value, selectionStart } = textarea;
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  const line = value.slice(lineStart, selectionStart);
  const match = line.match(LIST_ITEM);
  if (!match) return;

  e.preventDefault();
  const [marker, indent, , number] = match;
  if (line.trim() === marker.trim()) {
    //Empty item - remove its marker instead of adding another
    textarea.setSelectionRange(lineStart, selectionStart);
    replaceSelection(textarea, indent);
    return;
  }
  const next = number ? `${Number(number) + 1}. ` : match[2] + ' ';
  replaceSelection(textarea, `\n${indent}${next}`);
}

const TOOLBAR_BUTTONS = [
  { label: 'Bold', text: 'B', action: toggleBold },
  { label: 'Bulleted list', text: '•', action: (t) => toggleList(t, false) },
  { label: 'Numbered list', text: '1.', action: (t) => toggleList(t, true) },
];

//Adds the formatting toolbar above a textarea and list continuation inside it
const enhanceNoteEditor = (textarea) => {
  const toolbar = document.createElement('div');
  toolbar.className = 'md-toolbar';
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', 'Formatting');
  for (const { label, text, action } of TOOLBAR_BUTTONS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'md-toolbar-btn';
    button.textContent = text;
    button.title = label;
    button.setAttribute('aria-label', label);
    //Keep focus (and the selection) in the textarea when clicking a button
    button.addEventListener('mousedown', (e) => e.preventDefault());
    button.addEventListener('click', () => action(textarea));
    toolbar.appendChild(button);
  }
  textarea.before(toolbar);
  textarea.addEventListener('keydown', handleListEnter);
}

export { renderMarkdown, stripMarkdown, enhanceNoteEditor };
