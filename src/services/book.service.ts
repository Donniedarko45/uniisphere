import { GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, BUCKET_NAME } from '../config/s3.config';

export interface Book {
    key: string;
    name: string;
    url: string;
    lastModified?: Date;
}

export class BookService {
    private static instance: BookService;
    private readonly BASE_PATH = 'unii-books';
    
    private constructor() {}
    
    public static getInstance(): BookService {
        if (!BookService.instance) {
            BookService.instance = new BookService();
        }
        return BookService.instance;
    }

    async listAllBooks(): Promise<Book[]> {
        try {
            const command = new ListObjectsV2Command({
                Bucket: BUCKET_NAME,
                Prefix: this.BASE_PATH
            });

            const response = await s3Client.send(command);
            
            if (!response.Contents) {
                return [];
            }

            const books = await Promise.all(
                response.Contents
                    .filter(item => item.Key && !item.Key.endsWith('/'))
                    .map(async (item): Promise<Book | null> => {
                        if (!item.Key) return null;
                        
                        const getObjectCommand = new GetObjectCommand({
                            Bucket: BUCKET_NAME,
                            Key: item.Key,
                        });
                        
                        const url = await getSignedUrl(s3Client, getObjectCommand, {
                            expiresIn: 3600,
                        });

                        return {
                            key: item.Key,
                            name: item.Key.split('/').pop() || '',
                            url,
                            lastModified: item.LastModified,
                        };
                    })
            ).then(books => books.filter((book): book is Book => book !== null));

            return books;
        } catch (error) {
            console.error('Error listing books:', error);
            throw error;
        }
    }
} 