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

export { formatCitation };
