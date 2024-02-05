import { SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  NestInterceptor,
  Injectable,
  ExecutionContext,
  CallHandler
} from "@nestjs/common";
export const Permissions = (...permissions: string[]) =>
  SetMetadata("requiredPermissions", permissions);

@Injectable()
export class PermissionLoaderInterceptor implements NestInterceptor {
  constructor(
    // private readonly userRoleService: UserRoleService,
    private readonly reflector: Reflector
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const permissions = this.reflector.get<string[]>(
      "permissions",
      context.getHandler()
    );
    const controllerPath = this.reflector.get<string>(
      "path",
      context.getClass()
    );

    // if (permissions && controllerPath) {
    //   await Promise.all(
    //     permissions.map(async (permission) => {
    //       const permissionExists =
    //         await this.userRoleService.checkPermissionExists(permission);
    //       if (!permissionExists) {
    //         await this.userRoleService.createPermission(
    //           permission,
    //           controllerPath,
    //         );
    //       }
    //     }),
    //   );
    // }

    return next.handle();
  }
}
