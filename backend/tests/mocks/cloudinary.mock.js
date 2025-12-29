/**
 * Cloudinary Mock
 * Mocks Cloudinary API for testing
 */

export const mockCloudinary = {
  uploader: {
    upload: jest.fn(),
    destroy: jest.fn(),
    destroy_bulk: jest.fn(),
  },
  utils: {
    cloudinary_url: jest.fn(),
  },
};

// Default mock implementations
mockCloudinary.uploader.upload.mockResolvedValue({
  public_id: 'test_public_id',
  secure_url: 'https://res.cloudinary.com/test/image/upload/test_public_id.jpg',
  url: 'https://res.cloudinary.com/test/image/upload/test_public_id.jpg',
  width: 800,
  height: 600,
  format: 'jpg',
  resource_type: 'image',
});

mockCloudinary.uploader.destroy.mockResolvedValue({
  result: 'ok',
});

mockCloudinary.uploader.destroy_bulk.mockResolvedValue({
  deleted: {
    'test_public_id_1': 'deleted',
    'test_public_id_2': 'deleted',
  },
});

mockCloudinary.utils.cloudinary_url.mockReturnValue(
  'https://res.cloudinary.com/test/image/upload/test_public_id.jpg'
);

export default mockCloudinary;









