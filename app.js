const { time } = require("console");
const fs = require("fs");

function parseSubtitleLine(line) {
  const timeRegex = /<SYNC Start=(\d+)>/;
  const timeMatch = line.match(timeRegex);
  if (timeMatch) {
    const time = parseInt(timeMatch[1], 10);
    const text = line
      .replace(timeRegex, "")
      .replace(/<br>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim();
    return { time, text };
  }
  return null;
}

function padZero(num, length = 2) {
  return String(num).padStart(length, "0");
}

function formatTime(ms) {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  // 00:00:02,418
  return `${padZero(hour)}:${padZero(min % 60)}:${padZero(sec % 60)},${padZero(
    ms % 1000,
    3
  )}`;
}

function parseSMI(smi) {
  const lines = smi.split("\n");
  const syncLines = lines.filter(
    (line) => line.startsWith("<SYNC") || line.startsWith("<Sync")
  );

  const srtLines = syncLines.map(parseSubtitleLine);

  const srt = srtLines
    .map((strline, i) => {
      if (!strline) return;
      const { time, text } = strline;
      // 다음 라인 시간 계산 있다면 그것으로 설정하고 아니면 1초의 시간 을 줌
      const nextTime =
        i < srtLines.length - 1 && srtLines[i + 1]
          ? srtLines[i + 1].time
          : time + 1000;
      return `${i + 1}\n${formatTime(time)} --> ${formatTime(
        nextTime
      )}\n${text}\n\n`;
    })
    .filter((srt) => srt !== undefined);

  return srt;
}

function loadSMIFile(filepath) {
  const smi = fs.readFileSync(filepath, "utf16le");
  return parseSMI(smi);
}

const subtitles = loadSMIFile(`${__dirname}/public/sample.smi`);
fs.writeFileSync(`${__dirname}/public/sample_1.srt`, subtitles.join(""));
