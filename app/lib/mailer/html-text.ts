export function htmlHasText(html: string): boolean {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim().length > 0;
}

export function plunkSubject(subject: string): string {
  return subject.replace(/[\r\n]+/g, ' ').trim();
}
