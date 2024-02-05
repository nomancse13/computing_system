import { ExecutionContext, Injectable } from "@nestjs/common";
import { UnauthorizedException } from "@nestjs/common/exceptions";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { ErrorMessage, UserTypesEnum } from "src/authentication/common/enum";
import { IS_PUBLIC_KEY } from "src/authentication/utils/decorators";
import { decrypt } from "src/helper/crypto.helper";

@Injectable()
export class UserGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  // handle request
  handleRequest(err: any, user: any) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    }
    // if (decrypt(user.hashType) === UserTypesEnum.ADMIN) {
    //   throw new UnauthorizedException(ErrorMessage.UNAUTHORIZED);
    // }
    return user;
  }
}
