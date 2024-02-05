import { PartialType } from "@nestjs/swagger";
import { CreatePaymentVoucherDto } from "./create-payment-voucher.dto";

export class UpdatePaymentVoucherDto extends PartialType(
  CreatePaymentVoucherDto
) {}
