import { elasticClient, testElasticsearchConnection } from './elasticsearch.client';
import { logger } from '../../shared/utils/logger';
import Course from '../../models/courses/Course';

const INDEX_NAME = 'courses';

export interface CourseSearchResult {
  id: string;
  code: string;
  name: string;
  description?: string;
  tags?: string[];
  instructor?: string;
  image?: string;
  credits?: number;
  enrolled?: number;
  capacity?: number;
  visibility?: string;
  status?: string;
  score?: number;
}

export interface SearchResponse {
  results: CourseSearchResult[];
  total: number;
  took: number;
}

class CourseSearchService {
  private isElasticsearchAvailable = false;

  async initialize(): Promise<void> {
    this.isElasticsearchAvailable = await testElasticsearchConnection();
    
    if (this.isElasticsearchAvailable) {
      await this.ensureIndex();
      await this.syncCoursesToElasticsearch();
    }
  }

  private async ensureIndex(): Promise<void> {
    try {
      const exists = await elasticClient.indices.exists({ index: INDEX_NAME });
      
      if (!exists) {
        await this.createIndex();
      } else {
        try {
          await elasticClient.indices.putMapping({
            index: INDEX_NAME,
            properties: {
              syllabus: {
                properties: {
                  title: { type: 'text', analyzer: 'vietnamese_analyzer' },
                  description: { type: 'text', analyzer: 'vietnamese_analyzer' }
                }
              },
              instructor: { type: 'text', analyzer: 'vietnamese_analyzer' }
            }
          });
          logger.info(`🔄 Updated mapping for index: ${INDEX_NAME}`);
        } catch (mapErr: any) {
          logger.warn(`Mapping update failed (${mapErr.message}). Recreating index ${INDEX_NAME}.`);
          await this.recreateIndex();
        }
      }
    } catch (error: any) {
      logger.error(`Failed to create Elasticsearch index: ${error.message}`);
    }
  }

  private async createIndex() {
    await elasticClient.indices.create({
      index: INDEX_NAME,
      body: {
        settings: {
          analysis: {
            analyzer: {
              vietnamese_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'asciifolding']
              }
            }
          }
        },
        mappings: {
          properties: {
            code: { type: 'keyword' },
            name: { 
              type: 'text',
              analyzer: 'vietnamese_analyzer',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            description: { 
              type: 'text',
              analyzer: 'vietnamese_analyzer'
            },
            tags: { type: 'keyword' },
            instructor: { 
              type: 'text',
              analyzer: 'vietnamese_analyzer'
            },
            syllabus: {
              properties: {
                title: { type: 'text', analyzer: 'vietnamese_analyzer' },
                description: { type: 'text', analyzer: 'vietnamese_analyzer' }
              }
            },
            image: { type: 'keyword', index: false },
            credits: { type: 'integer' },
            enrolled: { type: 'integer' },
            capacity: { type: 'integer' },
            visibility: { type: 'keyword' },
            status: { type: 'keyword' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' }
          }
        }
      }
    });
    logger.info(`✅ Created Elasticsearch index: ${INDEX_NAME}`);
  }

  private async recreateIndex() {
    const exists = await elasticClient.indices.exists({ index: INDEX_NAME });
    if (exists) {
      await elasticClient.indices.delete({ index: INDEX_NAME });
      logger.warn(`🗑️ Deleted existing index ${INDEX_NAME} due to mapping conflicts`);
    }
    await this.createIndex();
    await this.syncCoursesToElasticsearch();
  }

  async syncCoursesToElasticsearch(): Promise<void> {
    if (!this.isElasticsearchAvailable) return;

    try {
      const courses = await Course.find({
        status: 'active',
        $or: [
          { visibility: 'public' },
          { visibility: { $exists: false } },
          { visibility: null }
        ]
      }).lean();
      
      if (courses.length === 0) {
        logger.info('No courses to sync to Elasticsearch');
        return;
      }

      const operations = courses.flatMap(course => [
        { index: { _index: INDEX_NAME, _id: course._id.toString() } },
        {
          code: course.code,
          name: course.name,
          description: course.description,
          tags: course.tags,
          instructor: course.instructor,
          syllabus: course.syllabus,
          image: course.image,
          credits: course.credits,
          enrolled: course.enrolled,
          capacity: course.capacity,
          visibility: course.visibility,
          status: course.status,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt
        }
      ]);

      const response = await elasticClient.bulk({ refresh: true, operations });
      
      if (response.errors) {
        logger.warn('Some documents failed to index');
      } else {
        logger.info(`✅ Synced ${courses.length} courses to Elasticsearch`);
      }
    } catch (error: any) {
      logger.error(`Failed to sync courses: ${error.message}`);
    }
  }

  async indexCourse(course: any): Promise<void> {
    if (!this.isElasticsearchAvailable) return;

    try {
      await elasticClient.index({
        index: INDEX_NAME,
        id: course._id.toString(),
        document: {
          code: course.code,
          name: course.name,
          description: course.description,
          tags: course.tags,
          instructor: course.instructor,
          syllabus: course.syllabus,
          image: course.image,
          credits: course.credits,
          enrolled: course.enrolled,
          capacity: course.capacity,
          visibility: course.visibility,
          status: course.status,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt
        },
        refresh: true
      });
      logger.info(`Indexed course: ${course.code}`);
    } catch (error: any) {
      logger.error(`Failed to index course: ${error.message}`);
    }
  }

  async removeCourse(courseId: string): Promise<void> {
    if (!this.isElasticsearchAvailable) return;

    try {
      await elasticClient.delete({
        index: INDEX_NAME,
        id: courseId,
        refresh: true
      });
      logger.info(`Removed course from index: ${courseId}`);
    } catch (error: any) {
      logger.warn(`Failed to remove course from index: ${error.message}`);
    }
  }

  async search(query: string, page = 1, limit = 10): Promise<SearchResponse> {
    if (!this.isElasticsearchAvailable) {
      return this.searchWithMongoDB(query, page, limit);
    }

    try {
      const from = (page - 1) * limit;
      
      const response = await elasticClient.search({
        index: INDEX_NAME,
        body: {
          from,
          size: limit,
          query: {
            bool: {
              should: [
                {
                  term: {
                    code: {
                      value: query.toUpperCase(),
                      boost: 10
                    }
                  }
                },
                {
                  prefix: {
                    code: {
                      value: query.toUpperCase(),
                      boost: 5
                    }
                  }
                },
                {
                  multi_match: {
                    query,
                    fields: [
                      'name^5',
                      'description^2',
                      'instructor^3',
                      'tags^2',
                      'syllabus.title^2',
                      'syllabus.description'
                    ],
                    type: 'best_fields',
                    fuzziness: 'AUTO',
                    prefix_length: 1
                  }
                },
                {
                  match_phrase: {
                    name: {
                      query,
                      boost: 4
                    }
                  }
                },

                {
                  match_phrase_prefix: {
                    name: {
                      query,
                      max_expansions: 10,
                      boost: 3
                    }
                  }
                },
                {
                  match_phrase_prefix: {
                    instructor: {
                      query,
                      max_expansions: 10,
                      boost: 2
                    }
                  }
                },
                {
                  match_phrase_prefix: {
                    'syllabus.title': {
                      query,
                      max_expansions: 10,
                      boost: 1.5
                    }
                  }
                }
              ],
              minimum_should_match: 1,
              filter: [
                {
                  bool: {
                    should: [
                      { term: { status: 'active' } },
                      { bool: { must_not: { exists: { field: 'status' } } } }
                    ],
                    minimum_should_match: 1
                  }
                },
                {
                  bool: {
                    should: [
                      { term: { visibility: 'public' } },
                      { bool: { must_not: { exists: { field: 'visibility' } } } }
                    ],
                    minimum_should_match: 1
                  }
                }
              ]
            }
          },
          highlight: {
            fields: {
              name: {},
              description: {}
            }
          }
        }
      });

      const hits = response.hits.hits;
      const total = typeof response.hits.total === 'number' 
        ? response.hits.total 
        : response.hits.total?.value || 0;

      const results: CourseSearchResult[] = hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
        score: hit._score
      }));

      return {
        results,
        total,
        took: response.took
      };
    } catch (error: any) {
      logger.error(`Elasticsearch search failed: ${error.message}`);
      return this.searchWithMongoDB(query, page, limit);
    }
  }

  private async searchWithMongoDB(query: string, page: number, limit: number): Promise<SearchResponse> {
    const skip = (page - 1) * limit;
    const regex = new RegExp(query, 'i');

    const [courses, total] = await Promise.all([
      Course.find({
        $and: [
          {
            $or: [
              { status: 'active' },
              { status: { $exists: false } },
              { status: null }
            ]
          },
          {
            $or: [
              { visibility: 'public' },
              { visibility: { $exists: false } },
              { visibility: null }
            ]
          },
          {
            $or: [
              { code: regex },
              { name: regex },
              { description: regex },
              { instructor: regex },
              { tags: regex },
              { 'syllabus.title': regex },
              { 'syllabus.description': regex }
            ]
          }
        ]
      })
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments({
        $and: [
          {
            $or: [
              { status: 'active' },
              { status: { $exists: false } },
              { status: null }
            ]
          },
          {
            $or: [
              { visibility: 'public' },
              { visibility: { $exists: false } },
              { visibility: null }
            ]
          },
          {
            $or: [
              { code: regex },
              { name: regex },
              { description: regex },
              { instructor: regex },
              { tags: regex },
              { 'syllabus.title': regex },
              { 'syllabus.description': regex }
            ]
          }
        ]
      })
    ]);

    const results: CourseSearchResult[] = courses.map(course => ({
      id: course._id.toString(),
      code: course.code,
      name: course.name,
      description: course.description,
      tags: course.tags,
      instructor: course.instructor,
      image: course.image,
      credits: course.credits,
      enrolled: course.enrolled,
      capacity: course.capacity,
      visibility: course.visibility,
      status: course.status
    }));

    return {
      results,
      total,
      took: 0
    };
  }

  async getSuggestions(query: string, limit = 5): Promise<string[]> {
    if (!this.isElasticsearchAvailable || !query) {
      return [];
    }

    try {
      const response = await elasticClient.search({
        index: INDEX_NAME,
        body: {
          size: limit,
          query: {
            bool: {
              should: [
                {
                  prefix: {
                    'name.keyword': {
                      value: query,
                      boost: 2
                    }
                  }
                },
                {
                  match: {
                    name: {
                      query,
                      fuzziness: 'AUTO'
                    }
                  }
                }
              ],
              filter: [
                { term: { status: 'active' } },
                { term: { visibility: 'public' } }
              ]
            }
          },
          _source: ['name', 'code']
        }
      });

      return response.hits.hits.map((hit: any) => hit._source.name);
    } catch (error: any) {
      logger.error(`Failed to get suggestions: ${error.message}`);
      return [];
    }
  }

  isAvailable(): boolean {
    return this.isElasticsearchAvailable;
  }
}

export const courseSearchService = new CourseSearchService();
