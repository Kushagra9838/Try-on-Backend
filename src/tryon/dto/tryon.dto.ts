import { IsString, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTryonDto {
  @ApiProperty({
    description: 'S3 path to customer photo',
    example: 's3://bucket-name/customer-photo.jpg',
  })
  @IsString()
  @IsNotEmpty()
  customerPhotoPath: string;

  @ApiProperty({
    description: 'S3 path to cloth photo',
    example: 's3://bucket-name/saree-cloth.jpg',
  })
  @IsString()
  @IsNotEmpty()
  clothPhotoPath: string;
}