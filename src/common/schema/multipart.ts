import { z } from 'zod';

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export const imageSchema = z.object({
  image: z
    .any()
    .refine((file) => file?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file?.mimetype), 'Only .jpg, .jpeg, .png and .webp formats are supported.')
    .optional()
});

export const fileSchema = z.object({
  file: z
    .any()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, 'Max file size is 5MB.')
    .refine(
      (file) => !file || ACCEPTED_FILE_TYPES.includes(file.mimetype),
      'Only PDF, DOCX, JPG, JPEG, PNG, and WEBP formats are supported.'
    )
    .optional(),
});