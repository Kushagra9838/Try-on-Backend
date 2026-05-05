import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TryonDocument = Tryon & Document;

@Schema({ timestamps: true })
export class Tryon {
  @Prop({ required: true })
  tryonId: string;

  @Prop({ required: true })
  customerPhotoPath: string;

  @Prop({ required: true })
  clothPhotoPath: string;

  @Prop({ default: 'pending', enum: ['pending', 'processing', 'completed', 'failed'] })
  status: string;

  @Prop({ nullable: true })
  resultPhotoPath: string;

  @Prop({ nullable: true })
  error: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  completedAt: Date;
}

export const TryonSchema = SchemaFactory.createForClass(Tryon);