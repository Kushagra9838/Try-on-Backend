import { Body, Controller, Get, Param, Post, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { TryonService } from './tryon.service';
import { CreateTryonDto } from './dto/tryon.dto';

@ApiTags('tryon')
@Controller('tryon')
export class TryonController {
  constructor(private readonly tryonService: TryonService) {}

  @Post()
  @ApiOperation({ summary: 'Create a virtual try-on job' })
  @ApiBody({ type: CreateTryonDto })
  @ApiResponse({ status: 201, description: 'Try-on job created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createTryon(@Body(ValidationPipe) createTryonDto: CreateTryonDto) {
    return this.tryonService.createTryonJob(
      createTryonDto.customerPhotoPath,
      createTryonDto.clothPhotoPath,
    );
  }

  @Get(':tryonId')
  @ApiOperation({ summary: 'Get try-on result by ID' })
  @ApiResponse({ status: 200, description: 'Try-on result retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Try-on record not found' })
  async getTryonResult(@Param('tryonId') tryonId: string) {
    return this.tryonService.getTryonResult(tryonId);
  }
}