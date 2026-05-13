import { Cron, CronOptions } from '@nestjs/schedule';

export const DEFAULT_CRON_TIME_ZONE = process.env.CRON_TIME_ZONE ?? 'Etc/GMT+4';

export function CronWithDefaultTZ(
  cronTime: string,
  options: CronOptions = {},
): MethodDecorator {
  if (options.timeZone || options.utcOffset !== undefined) {
    return Cron(cronTime, options);
  }

  return Cron(cronTime, {
    ...options,
    timeZone: DEFAULT_CRON_TIME_ZONE,
  } as CronOptions);
}
