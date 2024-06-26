import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from "@nestjs/common";
import { Request } from "express";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

const IgnoredPropertyName = Symbol("IgnoredPropertyName");

export function CustomInterceptorIgnore() {
  return function (
    target,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    descriptor.value[IgnoredPropertyName] = true;
  };
}
//global response interceptor interface
export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
  method: string;
  error: boolean;
}

@Injectable()
export class GlobalResponseInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const isIgnored = context.getHandler()[IgnoredPropertyName];

    if (!isIgnored) {
      return next.handle().pipe(
        map((data) => ({
          statusCode: context.switchToHttp().getResponse().statusCode,
          message: data.message,
          data: data.result,
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
          error: false
        }))
      );
    } else {
      return next.handle();
    }
  }
}
