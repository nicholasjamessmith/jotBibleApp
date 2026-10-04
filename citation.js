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

export { formatCitation, joinVerseText };
