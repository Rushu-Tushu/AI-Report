import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from parent directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKETS = {
    DOCUMENTS: 'documents',
    TEMPLATES: 'templates',
    EXPORTS: 'exports',
    FIGURES: 'figures',
};

async function initStorage() {
    console.log('Initializing Supabase Storage Buckets...');

    for (const [key, bucketName] of Object.entries(BUCKETS)) {
        console.log(`Checking bucket: ${bucketName}...`);

        const { data, error } = await supabase.storage.getBucket(bucketName);

        if (error && error.message.includes('not found')) {
            console.log(`Bucket '${bucketName}' not found. Creating...`);
            const { data: created, error: createError } = await supabase.storage.createBucket(bucketName, {
                public: false,
                fileSizeLimit: 52428800, // 50MB
            });

            if (createError) {
                console.error(`Failed to create bucket '${bucketName}':`, createError);
            } else {
                console.log(`Successfully created bucket '${bucketName}'.`);
            }
        } else if (error) {
            // Some other error
            console.error(`Error checking bucket '${bucketName}':`, error);
            // Try creating anyway if the get failed fundamentally? No, safer to log.
            // Actually, for "The resource was not found", let's try creating.
            if (error.status === 400 || error.message.toLowerCase().includes('not found')) {
                console.log(`Attempting to create '${bucketName}'...`);
                const { error: createError2 } = await supabase.storage.createBucket(bucketName, { public: false });
                if (createError2) console.error(`Failed: ${createError2.message}`);
                else console.log(`Created.`);
            }
        } else {
            console.log(`Bucket '${bucketName}' already exists.`);
        }
    }

    console.log('Storage initialization complete.');
}

initStorage();
