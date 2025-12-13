import { Router } from 'express';
import { userController, addressController, adminUserController } from '../di/container';
import { authenticate } from '../shared/middleware/auth';
import { isTeacherOrAdmin, isAdmin } from '../shared/middleware/authorize';
import { validate } from '../shared/middleware/validate';
import { updateProfileSchema } from '../shared/validation/user.schema';
import { UserMapper } from '../presentation/dto/user/User.dto';
import { uploadAvatar } from '../shared/middleware/upload';
import { HTTP_STATUS } from '../shared/constants/httpStatus';

export const userRoutes = Router();

/**
 * @swagger
 * /api/users/me/profile:
 *   get:
 *     summary: Lấy thông tin hồ sơ người dùng hiện tại
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thông tin profile thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Lấy thông tin profile thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     fullName:
 *                       type: string
 *                       example: Nguyễn Văn A
 *                     profile:
 *                       type: object
 *                       properties:
 *                         phone:
 *                           type: string
 *                           example: "0901234567"
 *                         avatarUrl:
 *                           type: string
 *                           example: https://example.com/avatar.jpg
 *                         bio:
 *                           type: string
 *                           example: "Giảng viên CNTT với 10 năm kinh nghiệm"
 *                     role:
 *                       type: string
 *                       example: customer
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy người dùng
 *       500:
 *         description: Lỗi server
 */
// GET /api/users/me/profile - Get current user profile
userRoutes.get(
  '/me/profile',
  authenticate,
  (req, res) => userController.getProfile(req, res)
);

/**
 * @swagger
 * /api/users/me/profile:
 *   put:
 *     summary: Cập nhật hồ sơ người dùng hiện tại
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Nguyễn Văn B
 *                 description: Họ tên hiển thị
 *               phone:
 *                 type: string
 *                 pattern: '^(\+84|84|0)[1-9][0-9]{8}$'
 *                 example: "0901234567"
 *                 description: Số điện thoại Việt Nam hợp lệ
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/new-avatar.jpg
 *                 description: URL ảnh đại diện
 *               bio:
 *                 type: string
 *                 example: "Yêu thích lập trình và giảng dạy"
 *                 description: Giới thiệu ngắn (tối đa 500 ký tự)
 *             minProperties: 1
 *           examples:
 *             updateName:
 *               summary: Cập nhật tên
 *               value:
 *                 fullName: Nguyễn Văn B
 *             updatePhone:
 *               summary: Cập nhật số điện thoại
 *               value:
 *                 phone: "0901234567"
 *             updateMultiple:
 *               summary: Cập nhật nhiều trường
 *               value:
 *                 fullName: Nguyễn Văn B
 *                 phone: "0901234567"
 *                 avatarUrl: https://example.com/avatar.jpg
 *                 bio: "Giới thiệu bản thân"
 *     responses:
 *       200:
 *         description: Cập nhật profile thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Cập nhật profile thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     profile:
 *                       type: object
 *                       properties:
 *                         phone:
 *                           type: string
 *                         avatarUrl:
 *                           type: string
 *                         bio:
 *                           type: string
 *                     role:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Số điện thoại không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy người dùng
 *       500:
 *         description: Lỗi server
 */
// PUT /api/users/me/profile - Update current user profile
userRoutes.put(
  '/me/profile',
  authenticate,
  validate(updateProfileSchema),
  (req, res) => userController.updateProfile(req, res)
);

/**
 * @swagger
 * /api/users/me/avatar:
 *   post:
 *     summary: Cập nhật ảnh đại diện
 *     description: Upload ảnh đại diện lên Cloudinary và cập nhật thông tin người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: File ảnh (jpg, jpeg, png, gif, webp) - tối đa 5MB
 *     responses:
 *       200:
 *         description: Cập nhật ảnh đại diện thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Cập nhật ảnh đại diện thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     avatar:
 *                       type: string
 *                       format: uri
 *                       example: https://res.cloudinary.com/dtk2qgorj/image/upload/v1234567890/fresh-food/avatars/user123.jpg
 *       400:
 *         description: Lỗi validation (không có file hoặc file không hợp lệ)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Vui lòng chọn file ảnh để upload
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy người dùng
 *       500:
 *         description: Lỗi server khi upload
 */
// POST /api/users/me/avatar - Upload avatar
userRoutes.post(
  '/me/avatar',
  authenticate,
  (req, res, next) => {
    uploadAvatar(req, res, (err: any) => {
      if (err) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: err.message || 'Lỗi khi upload file'
        });
      }
      return next();
    });
  },
  (req, res) => userController.uploadAvatar(req, res)
);

// Legacy endpoints
userRoutes.get('/profile', authenticate, (req, res) => {
  res.redirect(307, '/api/users/me/profile');
});

userRoutes.put('/profile', authenticate, validate(updateProfileSchema), (req, res) => {
  res.redirect(307, '/api/users/me/profile');
});

/**
 * @swagger
 * /api/users/me/addresses:
 *   get:
 *     summary: Lấy danh sách địa chỉ giao hàng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách địa chỉ thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Address'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Chưa đăng nhập
 */
userRoutes.get('/me/addresses', authenticate, (req, res) => {
  addressController.getUserAddresses(req, res);
});

/**
 * @swagger
 * /api/users/me/addresses/{id}/default:
 *   patch:
 *     summary: Đặt địa chỉ làm mặc định
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của địa chỉ
 *     responses:
 *       200:
 *         description: Đặt địa chỉ mặc định thành công
 *       404:
 *         description: Không tìm thấy địa chỉ
 *       401:
 *         description: Chưa đăng nhập
 */
userRoutes.patch('/me/addresses/:id/default', authenticate, (req, res) => {
  addressController.setDefaultAddress(req, res);
});

// ============================================================
// ORDER ROUTES
// ============================================================

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lấy danh sách người dùng (Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           example: customer
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: Nguyen
 *     responses:
 *       200:
 *         description: Danh sách người dùng trả về thành công
 */
userRoutes.get('/', authenticate, isAdmin, (req, res) => adminUserController.listUsers(req, res));
