import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Tryon, TryonDocument } from '../tryon/schema/tryon.schema';
import { randomUUID } from 'crypto';

@Injectable()
export class TryonService {
  constructor(
    @InjectModel(Tryon.name) private tryonModel: Model<TryonDocument>,
    @InjectQueue('tryon-queue') private tryonQueue: Queue,
  ) {}

  async createTryonJob(customerPhotoPath: string, clothPhotoPath: string) {
    const tryonId = randomUUID();

    // Create record in database with pending status
    const tryonRecord = new this.tryonModel({
      tryonId,
      customerPhotoPath,
      clothPhotoPath,
      status: 'pending',
    });

    await tryonRecord.save();

    // Add job to queue
    await this.tryonQueue.add('process-tryon', {
      tryonId,
      customerPhotoPath,
      clothPhotoPath,
    });

    return {
      tryonId,
      status: 'pending',
      message: 'Try-on job queued successfully',
    };
  }

  async getTryonResult(tryonId: string) {
    const tryonRecord = await this.tryonModel.findOne({ tryonId });

    if (!tryonRecord) {
      return { error: 'Try-on record not found' };
    }

    return {
      tryonId,
      status: tryonRecord.status,
      customerPhotoPath: tryonRecord.customerPhotoPath,
      clothPhotoPath: tryonRecord.clothPhotoPath,
      resultPhotoPath: tryonRecord.resultPhotoPath || null,
      error: tryonRecord.error || null,
      createdAt: tryonRecord.createdAt,
      completedAt: tryonRecord.completedAt || null,
    };
  }
}