import { PartialType } from "@nestjs/swagger";
import { CreatePaymentReceivedDto } from "./create-payment-received.dto";

export class UpdatePaymentReceivedDto extends PartialType(
  CreatePaymentReceivedDto
) {}
