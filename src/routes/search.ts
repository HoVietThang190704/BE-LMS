import { Router, Request, Response } from 'express';
import { courseSearchService } from '../services/search/CourseSearchService';
import { HTTP_STATUS } from '../shared/constants/httpStatus';

const router = Router();

/**
 * @swagger
 * /api/search/courses:
 *   get:
 *     summary: Search courses using Elasticsearch
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/courses', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query.trim()) {
      return res.json({
        success: true,
        data: {
          results: [],
          total: 0,
          took: 0
        }
      });
    }

    const searchResponse = await courseSearchService.search(query, page, limit);

    res.json({
      success: true,
      data: searchResponse,
      meta: {
        page,
        limit,
        totalPages: Math.ceil(searchResponse.total / limit),
        query,
        elasticsearchAvailable: courseSearchService.isAvailable()
      }
    });
  } catch (error: any) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     summary: Get search suggestions
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Partial search query
 *     responses:
 *       200:
 *         description: Suggestions list
 */
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    const limit = parseInt(req.query.limit as string) || 5;

    if (!query.trim()) {
      return res.json({
        success: true,
        data: []
      });
    }

    const suggestions = await courseSearchService.getSuggestions(query, limit);

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error: any) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get suggestions',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/search/sync:
 *   post:
 *     summary: Manually sync courses to Elasticsearch
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: Sync initiated
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    await courseSearchService.syncCoursesToElasticsearch();
    res.json({
      success: true,
      message: 'Courses synced to Elasticsearch'
    });
  } catch (error: any) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Sync failed',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/search/status:
 *   get:
 *     summary: Check Elasticsearch status
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: Elasticsearch status
 */
router.get('/status', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      elasticsearchAvailable: courseSearchService.isAvailable()
    }
  });
});

export default router;
