import { createHmac, timingSafeEqual } from 'crypto';

/** Fuso usado para definir "o dia" do check-in (padrão: horário de Brasília). */
export const APP_TIMEZONE = process.env.APP_TIMEZONE?.trim() || 'America/Sao_Paulo';

/** Data local no formato YYYY-MM-DD para o fuso informado. */
export function localDay(date: Date = new Date(), timeZone: string = APP_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Diferença, em ms, entre o horário local do fuso e o UTC no instante informado. */
function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour'),
    value('minute'),
    value('second'),
  );
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Instante (UTC) da meia-noite local do dia de `date` no fuso informado. */
export function startOfLocalDay(date: Date = new Date(), timeZone: string = APP_TIMEZONE): Date {
  const [year, month, day] = localDay(date, timeZone).split('-').map(Number);
  const midnightAsUtc = Date.UTC(year, month - 1, day);
  return new Date(midnightAsUtc - timeZoneOffsetMs(new Date(midnightAsUtc), timeZone));
}

/**
 * Código do QR do dia: `SIGA-YYYY-MM-DD-<assinatura>`.
 * A assinatura é um HMAC-SHA256 do dia com um segredo do servidor,
 * então o código não pode ser deduzido só sabendo a data.
 */
export function buildDailyCode(
  secret: string,
  date: Date = new Date(),
  timeZone: string = APP_TIMEZONE,
): string {
  const day = localDay(date, timeZone);
  const signature = createHmac('sha256', secret)
    .update(`siga-checkin:${day}`)
    .digest('base64url')
    .slice(0, 16);
  return `SIGA-${day}-${signature}`;
}

/** Compara o código recebido com o do dia em tempo constante. */
export function isValidDailyCode(
  received: unknown,
  secret: string,
  date: Date = new Date(),
  timeZone: string = APP_TIMEZONE,
): boolean {
  if (typeof received !== 'string') return false;
  const expected = Buffer.from(buildDailyCode(secret, date, timeZone));
  const actual = Buffer.from(received.trim());
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
