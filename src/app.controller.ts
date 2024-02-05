import { Controller, Get, UseGuards, Req, HttpStatus } from "@nestjs/common";
import { AppService } from "./app.service";
import { Injectable, Res } from "@nestjs/common";
import * as path from "path";
import * as fs from "fs";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  // fb token
  // @UseGuards(AuthGuard('facebook'))
  // @Get('/facebook')
  // async facebookAuth() {
  //   return HttpStatus.OK;
  // }

  // @UseGuards(AuthGuard('facebook'))
  // @Get('/facebook/redirect')
  // async fbAuthRedirect(@Req() req) {
  //   console.log('noman');

  //   const data = await this.appService.facebookLogin(req);

  //   console.log(data, 'ddata');

  //   return data;
  // }

  // @Get('/facebook')
  // @UseGuards(AuthGuard('facebook'))
  // async facebookLogin(): Promise<any> {
  //   return HttpStatus.OK;
  // }

  // @Get('/facebook/redirect')
  // @UseGuards(AuthGuard('facebook'))
  // async facebookLoginRedirect(@Req() req: Request): Promise<any> {
  //   const data = await this.appService.facebookLogin(req);
  //   console.log(data, 'ddaa');

  //   return {
  //     statusCode: HttpStatus.OK,
  //     payload: data,
  //   };
  // }

  // // google token
  // @UseGuards(AuthGuard('google'))
  // @Get()
  // async googleAuth(@Req() req) {}

  // @UseGuards(AuthGuard('google'))
  // @Get('auth/callback')
  // async googleAuthRedirect(@Req() req, @Res() res) {
  //   const data = await this.appService.googleLogin(req, res);

  //   console.log(data, 'ddata');

  //   return data;
  // }
}
