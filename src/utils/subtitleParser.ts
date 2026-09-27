export interface SubtitleCue {
  id: number;
  start: number;
  end: number;
  text: string;
}

function parseTimestamp(timeStr: string): number {
  if (!timeStr) return 0;
  // Format: HH:MM:SS.mmm or MM:SS.mmm or HH:MM:SS,mmm
  const clean = timeStr.trim().replace(',', '.');
  const parts = clean.split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  }
  return parseFloat(clean) || 0;
}

function cleanSubtitleText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]+>/g, '') // remove HTML / WebVTT tags like <v ...>, <b>, <i>, <c>
    .replace(/\{[^}]+\}/g, '') // remove ASS/SSA override tags like {\an8}
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Parses WebVTT (.vtt) and SubRip (.srt) subtitles into structured cues
 */
export function parseSubtitles(rawContent: string): SubtitleCue[] {
  if (!rawContent || typeof rawContent !== 'string') return [];

  const cues: SubtitleCue[] = [];
  const normalized = rawContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\s*\n/);

  let cueId = 1;

  for (let b = 0; b < blocks.length; b++) {
    const block = blocks[b].trim();
    if (!block || block === 'WEBVTT' || block.startsWith('NOTE') || block.startsWith('STYLE')) {
      continue;
    }

    const lines = block.split('\n');
    let timeLineIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        timeLineIdx = i;
        break;
      }
    }

    if (timeLineIdx === -1) continue;

    const timeLine = lines[timeLineIdx];
    const timeParts = timeLine.split('-->');
    if (timeParts.length < 2) continue;

    const startStr = timeParts[0].trim().split(' ')[0];
    const endStr = timeParts[1].trim().split(' ')[0];

    const start = parseTimestamp(startStr);
    const end = parseTimestamp(endStr);

    if (end <= start) continue;

    const textLines = lines.slice(timeLineIdx + 1);
    const rawText = textLines.join('\n');
    const text = cleanSubtitleText(rawText);

    if (text) {
      cues.push({
        id: cueId++,
        start,
        end,
        text,
      });
    }
  }

  return cues;
}
