const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo'
});

// Upload image to Cloudinary
const uploadImage = async (fileBuffer, folder = 'socialgram') => {
  try {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: folder,
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
              bytes: result.bytes
            });
          }
        }
      ).end(fileBuffer);
    });
  } catch (error) {
    throw new Error('Image upload failed: ' + error.message);
  }
};

// Upload video to Cloudinary
const uploadVideo = async (fileBuffer, folder = 'socialgram/videos') => {
  try {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: folder,
          transformation: [
            { quality: 'auto:good' },
            { format: 'mp4' }
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
              width: result.width,
              height: result.height,
              duration: result.duration,
              format: result.format,
              bytes: result.bytes,
              thumbnail: result.secure_url.replace('/upload/', '/upload/so_0/')
            });
          }
        }
      ).end(fileBuffer);
    });
  } catch (error) {
    throw new Error('Video upload failed: ' + error.message);
  }
};

// Upload file (documents, audio, etc.)
const uploadFile = async (fileBuffer, originalName, folder = 'socialgram/files') => {
  try {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: folder,
          public_id: `${Date.now()}_${originalName}`,
          use_filename: true
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
              format: result.format,
              bytes: result.bytes,
              filename: originalName
            });
          }
        }
      ).end(fileBuffer);
    });
  } catch (error) {
    throw new Error('File upload failed: ' + error.message);
  }
};

// Delete file from Cloudinary
const deleteFile = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    throw new Error('File deletion failed: ' + error.message);
  }
};

// Generate thumbnail for video
const generateVideoThumbnail = (videoUrl) => {
  return videoUrl.replace('/upload/', '/upload/so_0,w_400,h_300,c_fill/');
};

// Optimize image URL
const optimizeImageUrl = (url, width, height) => {
  if (!url) return url;
  return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill,f_auto,q_auto/`);
};

module.exports = {
  uploadImage,
  uploadVideo,
  uploadFile,
  deleteFile,
  generateVideoThumbnail,
  optimizeImageUrl
};