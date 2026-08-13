import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedExtensions = [
    '.mp4',
    '.mkv',
    '.webm',
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.srt',
    '.vtt'
  ];

  const ext = file.originalname
    .substring(file.originalname.lastIndexOf('.'))
    .toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed extensions: ${allowedExtensions.join(', ')}`
      )
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024
  }
});