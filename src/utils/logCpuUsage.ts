export function logCpuUsage(headerMessage: string, times: number[], names: string[]): void {
  let messageToPrint = headerMessage;
  messageToPrint += `${names[0]}: ${times[0]} | `;
  for (let i = 1; i < times.length; i++) {
    messageToPrint += `${names[i]}: ${times[i] - times[i - 1]} | `;
  }
  console.log(messageToPrint);
}
