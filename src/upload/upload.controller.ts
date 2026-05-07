import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { S3 } from 'aws-sdk';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  private s3 = new S3({
    region: process.env.AWS_REGION,
  });

  @Get('presigned-url')
  @ApiOperation({ summary: 'Get presigned URL for S3 upload' })
  @ApiQuery({
    name: 'fileName',
    required: true,
    description: 'Name of the file to upload',
    example: 'customer-photo.jpg',
  })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL generated successfully',
    schema: {
      example: {
        url: 'https://bucket-name.s3.region.amazonaws.com/uploads/123456-customer-photo.jpg?...',
        key: 'uploads/123456-customer-photo.jpg',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file name' })
  async getPresignedUrl(@Query('fileName') fileName: string) {
    const key = `uploads/${Date.now()}-${fileName}`;

    const url = await this.s3.getSignedUrlPromise('putObject', {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: 'image/jpeg',
    });
    return { url, key };
  }
}