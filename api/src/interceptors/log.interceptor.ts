import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CustomLogger } from 'src/common/utils/custom-logger.service';

export class LogHttpInterceptor implements NestInterceptor {
  private readonly logger: CustomLogger;
  constructor() {
    this.logger = new CustomLogger(LogHttpInterceptor.name);
  }
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const dt = Date.now();
    const request = context.switchToHttp().getRequest<{ url: string; method: string }>();

    return next.handle().pipe(
      finalize(() => {
        this.logger.log(`${request.method} ${request.url} — ${Date.now() - dt}ms`);
      }),
    );
  }
}
