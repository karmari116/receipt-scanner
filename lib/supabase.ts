import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Upload a file to Supabase Storage
export async function uploadReceiptImage(
    buffer: Buffer,
    fileName: string,
    year: string,
    month: string
): Promise<string | null> {
    try {
        // Create the file path: receipts/YYYY/MM/filename.jpg
        const filePath = `${year}/${month}/${fileName}`;

        const { data, error } = await supabase.storage
            .from('receipts')
            .upload(filePath, buffer, {
                contentType: 'image/jpeg',
                upsert: false // Don't overwrite existing files
            });

        if (error) {
            console.error('Supabase Storage upload error:', error);
            return null;
        }

        // Get the public URL for the uploaded file
        const { data: urlData } = supabase.storage
            .from('receipts')
            .getPublicUrl(filePath);

        return urlData.publicUrl;
    } catch (error) {
        console.error('Error uploading to Supabase Storage:', error);
        return null;
    }
}
