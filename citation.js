//Formats an ordered list of verse records into an SBL Handbook of Style-style citation.
//verseRecords: ordered array of { id, number }, where id is "BOOKID.chapter.verse" (e.g. "JHN.3.16").
//Consecutive-run detection only considers verse number continuity within the same chapter -
//cross-chapter selection (not reachable through the current single-chapter UI) is joined with "; "
//rather than attempting a true cross-chapter dash range.
const formatCitation = (bookName, verseRecords) => {
  if (!verseRecords || verseRecords.length === 0) return '';

  const parsed = verseRecords.map((v) => {
    const parts = v.id.split('.');
    return { chapter: Number(parts[1]), verse: Number(parts[2]) };
  });

  //Group by chapter, preserving order of first appearance
  const chapterOrder = [];
  const byChapter = new Map();
  for (const { chapter, verse } of parsed) {
    if (!byChapter.has(chapter)) {
      byChapter.set(chapter, []);
      chapterOrder.push(chapter);
    }
    byChapter.get(chapter).push(verse);
  }

  const chapterSegments = chapterOrder.map((chapter) => {
    const verses = byChapter.get(chapter);

    //Group consecutive verse numbers into runs
    const runs = [];
    let run = [verses[0]];
    for (let i = 1; i < verses.length; i++) {
      if (verses[i] === run[run.length - 1] + 1) {
        run.push(verses[i]);
      } else {
        runs.push(run);
        run = [verses[i]];
      }
    }
    runs.push(run);

    const runStrings = runs.map((r) => r.length === 1 ? `${r[0]}` : `${r[0]}–${r[r.length - 1]}`);
    return `${chapter}:${runStrings.join(', ')}`;
  });

  return `${bookName} ${chapterSegments.join('; ')}`;
}

//Joins an ordered list of verse records ({ id, text }) into one passage string, inserting an
//ellipsis wherever the next verse doesn't directly follow the previous one (a skipped verse
//or a chapter change) - e.g. John 3:16, 18 -> "For God so loved... … He that believeth..."
const joinVerseText = (verseRecords) => verseRecords.map((v, i) => {
  const text = v.text.trim();
  if (i === 0) return text;
  const [, prevChapter, prevVerse] = verseRecords[i - 1].id.split('.');
  const [, chapter, verse] = v.id.split('.');
  const consecutive = chapter === prevChapter && Number(verse) === Number(prevVerse) + 1;
  return consecutive ? ` ${text}` : ` … ${text}`;
}).join('');

//Inverse of formatCitation - finds references like "John 3:16", "Romans 8:28–30, 32",
//"1 Cor 13:4", "Song of Solomon 2:1" or "John 3:16; 4:2" in free text.
//After a comma, a lone 1-3 followed by a capitalized word starts a new book, so
//"Romans 8:28, 1 Cor 13:4" reads as two citations rather than Romans 8:28 + verse 1.
const VERSE_ITEM = String.raw`\d+(?:\s*[-–]\s*\d+(?!\d*:))?`;
const VERSE_LIST = String.raw`${VERSE_ITEM}(?:\s*,\s*(?![1-3]\s?[A-Z])${VERSE_ITEM})*`;
const CITATION_PATTERN = new RegExp(
  String.raw`(?<![A-Za-z0-9])((?:[1-3]\s?)?[A-Za-z]+\.?(?:\s+of\s+[A-Za-z]+)?)\s+(\d+):(${VERSE_LIST})((?:\s*;\s*\d+:${VERSE_LIST})*)`,
  'g'
);
const MAX_RANGE = 200; // guards against typos like "1:1-9999" expanding into thousands of ids

const normalizeBookName = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

//Exact name/abbreviation/id match first, then a unique prefix of the full name
//("Rom" -> Romans, "1 Cor" -> 1 Corinthians); ambiguous prefixes ("Jud") match nothing.
const resolveBook = (token, books) => {
  const key = normalizeBookName(token);
  const exact = books.find((b) => [b.name, b.abbreviation, b.id].some((n) => n && normalizeBookName(n) === key));
  if (exact) return exact;
  if (key.replace(/^\d/, '').length < 3) return null;
  const matches = books.filter((b) => normalizeBookName(b.name).startsWith(key));
  return matches.length === 1 ? matches[0] : null;
}

const expandVerseList = (list) => list.split(',').flatMap((item) => {
  const [start, end] = item.split(/[-–]/).map((n) => Number(n.trim()));
  if (!end || end < start || end - start > MAX_RANGE) return [start];
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

//Returns [{ index, text, segments: [{ chapterId, verseIds }] }] in reading order - one entry per
//citation, one segment per chapter it names. books: the getBooksCached list ({ id, name, abbreviation }).
const parseCitations = (text, books) => {
  const citations = [];
  for (const match of text.matchAll(CITATION_PATTERN)) {
    const [full, bookToken, chapter, verseList, moreChapters] = match;
    const book = resolveBook(bookToken, books);
    if (!book) continue;

    const chapterParts = [[chapter, verseList]];
    for (const part of moreChapters.split(';').slice(1)) {
      const [ch, verses] = part.split(':');
      chapterParts.push([ch.trim(), verses]);
    }
    const segments = chapterParts.map(([ch, verses]) => ({
      chapterId: `${book.id}.${Number(ch)}`,
      verseIds: expandVerseList(verses).map((v) => `${book.id}.${Number(ch)}.${v}`),
    }));
    citations.push({ index: match.index, text: full, segments });
  }
  return citations;
}

export { formatCitation, joinVerseText, parseCitations };
