export function logCpuUsage(headerMessage: string, times: number[], names: string[]): void {
  let messageToPrint = headerMessage;
  const cpuLimit = Game.cpu.limit;
  const time = (times[0] / cpuLimit) * 100;
  messageToPrint += `| ${names[0]}: ${time.toPrecision(3)}% | `;
  for (let i = 1; i < times.length; i++) {
    const time = ((times[i] - times[i - 1]) / cpuLimit) * 100;

    messageToPrint += `${names[i]}: ${time.toPrecision(3)}% | `;
  }
  console.log(messageToPrint);
}

function getCpuUsageColor(percentCpuUsed: number) {
  const green = Math.ceil(255 * (1 - percentCpuUsed));
  const red = Math.floor(255 * percentCpuUsed);
  return `rgb(${red},${green},0)`;
}
