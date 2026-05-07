import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Replicate from 'replicate';
import { Tryon, TryonDocument } from './schema/tryon.schema';

@Processor('tryon-queue')
export class TryonProcessor extends WorkerHost {
  private replicate: Replicate;

  constructor(
    @InjectModel(Tryon.name)
    private readonly tryonModel: Model<TryonDocument>,
  ) {
    super();

    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });
  }

  async process(job: Job<any>) {
    const { tryonId, customerPhotoPath, clothPhotoPath } = job.data;

    try {
      // 1. mark processing
      await this.tryonModel.findOneAndUpdate(
        { tryonId },
        { status: 'processing' },
      );

      // 2. S3 URLs
      const customerUrl = this.constructS3Url(customerPhotoPath);
      const clothUrl = this.constructS3Url(clothPhotoPath);

      // 3. Replicate call
      const rawOutput = await this.callReplicateTryon(customerUrl, clothUrl);

      console.log('RAW OUTPUT TYPE:', typeof rawOutput);
      console.log('RAW OUTPUT:', rawOutput);
      const resolved = await this.resolveStream(rawOutput);
      console.log('RESOLVED OUTPUT:', resolved);

      // 4. extract final image URL
      const resultImageUrl = this.extractOutput(rawOutput);

      if (!resultImageUrl) {
        throw new Error('Replicate returned empty output');
      }

      // 5. save DB
      await this.tryonModel.findOneAndUpdate(
        { tryonId },
        {
          status: 'completed',
          resultPhotoPath: resultImageUrl,
          completedAt: new Date(),
        },
      );

      return { success: true, resultImageUrl };
    } catch (error: any) {
      await this.tryonModel.findOneAndUpdate(
        { tryonId },
        {
          status: 'failed',
          error: error.message,
        },
      );

      throw error;
    }
  }

  // -------------------------
  // S3 URL builder
  // -------------------------
  private constructS3Url(key: string): string {
    const bucket = process.env.AWS_BUCKET_NAME || 'tryon-v1';
    const region = process.env.AWS_REGION || 'ap-south-1';

    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  // -------------------------
  // Replicate call
  // -------------------------
  private async callReplicateTryon(
    personImage: string,
    clothImage: string,
  ): Promise<string> {
    const prediction = await this.replicate.predictions.create({
      model: 'reve/remix',
      input: {
        prompt: `
  A realistic photo of the same person from the first image,
  now wearing the clothing from the second image.
  Maintain realistic lighting, shadows, and fabric details.
        `,

        reference_images: [personImage, clothImage],

        aspect_ratio: '1:1',
        output_format: 'png',
      },
    });

    console.log('PREDICTION:', prediction);

    // wait until completed
    const finalPrediction = await this.replicate.wait(prediction);

    console.log('FINAL:', finalPrediction);

    // extract URL
    if (typeof finalPrediction.output === 'string') {
      return finalPrediction.output;
    }

    if (
      Array.isArray(finalPrediction.output) &&
      finalPrediction.output.length > 0
    ) {
      return finalPrediction.output[0];
    }

    throw new Error('No output image returned');
  }

  // -------------------------
  // SAFE output extraction
  // -------------------------
  private extractOutput(output: any): string | null {
    if (!output) return null;

    // Case 1: direct string (MOST COMMON in Replicate SDK)
    if (typeof output === 'string') {
      return output;
    }

    // Case 2: array
    if (Array.isArray(output)) {
      return output[0] || null;
    }

    // Case 3: object format (API style response)
    if (typeof output === 'object') {
      return output.output?.[0] || output.output || null;
    }

    return null;
  }

  private async resolveStream(output: any): Promise<any> {
    if (!(output instanceof ReadableStream)) {
      return output;
    }

    const reader = output.getReader();
    const decoder = new TextDecoder();
    let result = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value);
    }

    return JSON.parse(result);
  }
}
