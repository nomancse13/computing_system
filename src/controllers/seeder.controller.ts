import {
  Controller,
  Post
} from "@nestjs/common";

import {
  ApiOperation,
  ApiTags
} from "@nestjs/swagger";
import { SeederService } from "src/database/seeders/seeder.service";

@ApiTags("Seeder")
@Controller({
  path: "seeder",
  version: "1"
})
export class SeederController {
  constructor(private seederService: SeederService) {}

  /**
   * Real data insert
   */
  @Post("real/data")
  @ApiOperation({
    summary: "Real data insert",
    description: "This api is responsible for insert account group real data"
  })
  async realData() {
    const data = await this.seederService.create();
    return { message: "successful", result: data };
  }
 
}
